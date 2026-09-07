"""Dataset repository."""
import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.db.models.dataset import Dataset


class DatasetRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, name: str, domain: str = "general", column_mapping: dict = None, total_rows: int = 0, raw_file_path: str = None) -> Dataset:
        dataset = Dataset(
            name=name,
            domain=domain,
            column_mapping=column_mapping or {},
            total_rows=total_rows,
            raw_file_path=raw_file_path,
        )
        self.db.add(dataset)
        self.db.commit()
        self.db.refresh(dataset)
        return dataset

    def get(self, dataset_id: uuid.UUID) -> Optional[Dataset]:
        return self.db.query(Dataset).filter(Dataset.id == dataset_id).first()

    def list_all(self, limit: int = 50, offset: int = 0) -> List[Dataset]:
        return self.db.query(Dataset).order_by(Dataset.uploaded_at.desc()).offset(offset).limit(limit).all()

    def update_progress(self, dataset_id: uuid.UUID, processed_rows: int, total_rows: Optional[int] = None) -> Optional[Dataset]:
        dataset = self.get(dataset_id)
        if dataset:
            dataset.processed_rows = processed_rows
            if total_rows is not None:
                dataset.total_rows = total_rows
            self.db.commit()
            self.db.refresh(dataset)
        return dataset
