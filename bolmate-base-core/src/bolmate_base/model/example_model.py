from sqlalchemy import Column, String

from bolmate_base.model.base_model import Base


class Example(Base):
    __tablename__ = 'example'
    hello_world = Column(String, nullable=False, default='Hello world')
