from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class ApiResponse(BaseModel):
    success: bool = True
    message: str = "OK"
    data: Optional[Any] = None

class DataProvenance(BaseModel):
    data_provenance_note: str = (
        "Prototype uses public/synthetic aerospace data for demonstration. "
        "Real operational defence aircraft data is not used."
    )
    is_simulation: bool = True
