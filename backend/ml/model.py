"""
BhoomiDrishti-NER: Physics-Guided Machine Learning (PGML) XGBoost Pipeline
Trains an XGBoost multi-class classifier on geomorphic and hydrometeorological features
and enforces physical boundary constraints (FS > 1.25 suppresses false Red alerts).
"""
import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Union
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

from backend.data.kaggle_loader import load_or_generate_dataset
from backend.ml.physics import compute_factor_of_safety, compute_api_11

ML_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_JSON_PATH = os.path.join(ML_DIR, "xgboost_ner.json")
METADATA_JSON_PATH = os.path.join(ML_DIR, "model_metadata.json")

FEATURE_NAMES = [
    "slope_deg",
    "aspect_deg",
    "twi",
    "daily_rainfall_mm",
    "api_11",
    "soil_moisture",
    "factor_of_safety"
]

RISK_LABELS = {
    0: {"name": "Normal / Green", "code": "GREEN", "color": "#10B981", "alert_urgency": "None"},
    1: {"name": "Advisory / Yellow", "code": "YELLOW", "color": "#EAB308", "alert_urgency": "Advisory"},
    2: {"name": "Warning / Orange", "code": "ORANGE", "color": "#F97316", "alert_urgency": "Expected"},
    3: {"name": "Critical / Red", "code": "RED", "color": "#EF4444", "alert_urgency": "Immediate"}
}

class PhysicsGuidedXGBoost:
    def __init__(self):
        self.model: Optional[xgb.Booster] = None
        self.metadata: Dict[str, Any] = {}
        
    def train(self, df: Optional[pd.DataFrame] = None) -> Dict[str, Any]:
        """
        Trains the XGBoost classifier and persists model weights.
        """
        if df is None:
            df = load_or_generate_dataset()
            
        X = df[FEATURE_NAMES].values
        y = df["risk_level"].values
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=FEATURE_NAMES)
        dtest = xgb.DMatrix(X_test, label=y_test, feature_names=FEATURE_NAMES)
        
        params = {
            "objective": "multi:softprob",
            "num_class": 4,
            "max_depth": 5,
            "learning_rate": 0.08,
            "subsample": 0.85,
            "colsample_bytree": 0.85,
            "eval_metric": "mlogloss",
            "seed": 42
        }
        
        evallist = [(dtrain, "train"), (dtest, "eval")]
        self.model = xgb.train(
            params,
            dtrain,
            num_boost_round=120,
            evals=evallist,
            verbose_eval=False
        )
        
        # Evaluate
        preds_prob = self.model.predict(dtest)
        raw_preds = np.argmax(preds_prob, axis=1)
        
        # Apply physics boundary constraint on test set
        fs_test = X_test[:, FEATURE_NAMES.index("factor_of_safety")]
        pgml_preds = self._apply_physics_boundary(raw_preds, fs_test)
        
        acc = float(accuracy_score(y_test, pgml_preds))
        report = classification_report(y_test, pgml_preds, output_dict=True)
        
        # Persist model
        self.model.save_model(MODEL_JSON_PATH)
        
        # Feature importances
        score_dict = self.model.get_score(importance_type="gain")
        feature_importance = {feat: float(score_dict.get(feat, 0.0)) for feat in FEATURE_NAMES}
        
        self.metadata = {
            "accuracy": acc,
            "test_samples": len(y_test),
            "features": FEATURE_NAMES,
            "feature_importance": feature_importance,
            "classification_report": report,
            "physics_boundary_rule": "If FS > 1.25 then risk_level <= 1 (suppress false Red/Orange alerts)"
        }
        
        with open(METADATA_JSON_PATH, "w") as f:
            json.dump(self.metadata, f, indent=2)
            
        print(f"[PGML Model] Trained successfully. Test Accuracy: {acc:.4f}")
        return self.metadata

    def load_model(self):
        """Loads serialized XGBoost model or trains if missing."""
        if not os.path.exists(MODEL_JSON_PATH):
            self.train()
        else:
            self.model = xgb.Booster()
            self.model.load_model(MODEL_JSON_PATH)
            if os.path.exists(METADATA_JSON_PATH):
                with open(METADATA_JSON_PATH, "r") as f:
                    self.metadata = json.load(f)

    @staticmethod
    def _apply_physics_boundary(raw_risk: np.ndarray, fs_values: np.ndarray) -> np.ndarray:
        """
        Enforces deterministic geotechnical physics boundary:
        If FS > 1.25, the slope possesses sufficient mechanical shear margin;
        suppress false positive Red (3) or Orange (2) alerts to max Advisory (1).
        If FS < 0.95, the slope is mechanically failing; elevate to at least Orange (2) / Red (3).
        """
        adjusted_risk = raw_risk.copy()
        for i in range(len(adjusted_risk)):
            fs = fs_values[i]
            if fs > 1.25 and adjusted_risk[i] >= 2:
                adjusted_risk[i] = 1 # Suppress false alarm
            elif fs < 0.95 and adjusted_risk[i] < 2:
                adjusted_risk[i] = 3 # Hard physical failure override
        return adjusted_risk

    def predict_single(
        self,
        slope_deg: float,
        aspect_deg: float,
        twi: float,
        daily_rainfall_mm: float,
        api_11: float,
        soil_moisture: float,
        fs: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Infers risk for a single road grid point with physics constraint.
        """
        if self.model is None:
            self.load_model()
            
        if fs is None:
            fs = float(compute_factor_of_safety(slope_deg, api_11, twi))
            
        features = np.array([[slope_deg, aspect_deg, twi, daily_rainfall_mm, api_11, soil_moisture, fs]])
        dmatrix = xgb.DMatrix(features, feature_names=FEATURE_NAMES)
        
        probs = self.model.predict(dmatrix)[0] # Shape (4,)
        raw_level = int(np.argmax(probs))
        
        # Apply physics boundary
        adj_level = int(self._apply_physics_boundary(np.array([raw_level]), np.array([fs]))[0])
        
        is_physics_suppressed = (raw_level >= 2 and adj_level <= 1 and fs > 1.25)
        is_physics_elevated = (raw_level < 2 and adj_level >= 2 and fs < 0.95)
        
        info = RISK_LABELS[adj_level]
        
        return {
            "risk_level": adj_level,
            "raw_xgb_level": raw_level,
            "risk_name": info["name"],
            "risk_code": info["code"],
            "color": info["color"],
            "alert_urgency": info["alert_urgency"],
            "factor_of_safety": round(float(fs), 3),
            "api_11": round(float(api_11), 2),
            "probabilities": {
                "green": round(float(probs[0]), 4),
                "yellow": round(float(probs[1]), 4),
                "orange": round(float(probs[2]), 4),
                "red": round(float(probs[3]), 4),
            },
            "physics_guard_active": is_physics_suppressed or is_physics_elevated,
            "physics_override_reason": "Suppressed false alarm (FS > 1.25)" if is_physics_suppressed else (
                "Elevated due to mechanical shear failure (FS < 0.95)" if is_physics_elevated else "None"
            )
        }

    def predict_batch(self, feature_df: pd.DataFrame) -> pd.DataFrame:
        """
        Vectorized batch prediction across entire corridor grid.
        """
        if self.model is None:
            self.load_model()
            
        X = feature_df[FEATURE_NAMES].values
        dmatrix = xgb.DMatrix(X, feature_names=FEATURE_NAMES)
        probs = self.model.predict(dmatrix)
        raw_levels = np.argmax(probs, axis=1)
        
        fs_vals = feature_df["factor_of_safety"].values
        adj_levels = self._apply_physics_boundary(raw_levels, fs_vals)
        
        result_df = feature_df.copy()
        result_df["risk_level"] = adj_levels
        result_df["raw_xgb_level"] = raw_levels
        result_df["prob_red"] = np.round(probs[:, 3], 3)
        result_df["prob_orange"] = np.round(probs[:, 2], 3)
        result_df["prob_yellow"] = np.round(probs[:, 1], 3)
        result_df["prob_green"] = np.round(probs[:, 0], 3)
        result_df["color"] = [RISK_LABELS[l]["color"] for l in adj_levels]
        result_df["risk_name"] = [RISK_LABELS[l]["name"] for l in adj_levels]
        
        return result_df

# Global singleton
pgml_engine = PhysicsGuidedXGBoost()

if __name__ == "__main__":
    meta = pgml_engine.train()
    test_pred = pgml_engine.predict_single(
        slope_deg=42.0,
        aspect_deg=180.0,
        twi=8.2,
        daily_rainfall_mm=95.0,
        api_11=140.0,
        soil_moisture=0.68
    )
    print("Test prediction:", json.dumps(test_pred, indent=2))
