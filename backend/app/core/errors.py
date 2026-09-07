"""Domain exception hierarchy for Feedback Intelligence OS."""
from typing import Optional


class FeedbackOSError(Exception):
    """Base application exception with error code and status mapping."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class ValidationError(FeedbackOSError):
    """Validation failed for request or uploaded data."""
    def __init__(self, message: str):
        super().__init__(message, code="VALIDATION_ERROR", status_code=400)


class DatasetNotFoundError(FeedbackOSError):
    """Requested dataset does not exist."""
    def __init__(self, message: str = "Dataset not found"):
        super().__init__(message, code="DATASET_NOT_FOUND", status_code=404)


class ModelUnavailableError(FeedbackOSError):
    """ML model is unavailable or failed to initialize."""
    def __init__(self, message: str = "ML model unavailable"):
        super().__init__(message, code="MODEL_UNAVAILABLE", status_code=503)


class AnalysisFailedError(FeedbackOSError):
    """Analysis or background processing job failed."""
    def __init__(self, message: str = "Analysis processing failed"):
        super().__init__(message, code="ANALYSIS_FAILED", status_code=500)


class InvalidFilterError(FeedbackOSError):
    """Query parameter or filter condition is invalid."""
    def __init__(self, message: str = "Invalid filter condition"):
        super().__init__(message, code="INVALID_FILTER", status_code=400)


class QueryNotAnswerableError(FeedbackOSError):
    """NL Query cannot be answered with current data."""
    def __init__(self, message: str = "Question cannot be mapped to available data"):
        super().__init__(message, code="QUERY_NOT_ANSWERABLE", status_code=200)


class EvidenceRequiredError(FeedbackOSError):
    """Insight cannot be created without at least one evidence feedback row."""
    def __init__(self, message: str = "Insight must reference at least one evidence feedback record"):
        super().__init__(message, code="EVIDENCE_REQUIRED", status_code=400)
