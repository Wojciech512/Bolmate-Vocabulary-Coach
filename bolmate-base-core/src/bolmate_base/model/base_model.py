from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Sequence, Any
from uuid import uuid4

from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import class_mapper, properties, declarative_base


def json_serializer(value: Any) -> Any:
    # Preprocessing
    if isinstance(value, set):
        value = list(value)

    if value is None or isinstance(value, (str, int, float)):
        # No serialization needed
        pass
    elif isinstance(value, date):
        value = value.isoformat()
    elif isinstance(value, UUID):
        value = str(value)
    elif isinstance(value, Decimal):
        value = float(value)
    elif isinstance(value, dict):
        for key, val in value.items():
            value[key] = json_serializer(val)
    elif isinstance(value, Enum):
        value = value.value
    elif isinstance(value, list):
        for idx in range(len(value)):
            value[idx] = json_serializer(value[idx])
    elif isinstance(value, bytes):
        value = str(value)
    return value


class BaseModel:
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at = Column(DateTime(timezone=False), server_default=func.now(), default=datetime.now)
    updated_at = Column(DateTime(timezone=False), onupdate=datetime.now)

    @classmethod
    def get_columns(cls):
        """Returns a dict with the column name as key and
        the column class as value."""
        return {prop.key: getattr(cls, prop.key) for prop in
                class_mapper(cls).iterate_properties
                if isinstance(prop, properties.ColumnProperty)}

    @classmethod
    def get_relations(cls):
        """
        Returns a dict with the relation name as key
        and the relation class as value.
        """
        return {prop.key: prop.mapper.class_ for prop in
                class_mapper(cls).iterate_properties
                if isinstance(prop, properties.RelationshipProperty)}

    _default_dict_fields: Sequence[str] = list()
    _exclude_dict_fields: Sequence[str] = list()
    _include_dict_fields: Sequence[str] = list()
    _include_private_fields: bool = False

    def to_dict(self, *, serialize: bool = True) -> dict:
        visited = list()
        fields = list()
        obj = dict()

        columns = self.__class__.get_columns()

        visited = visited[:]
        visited.append(self.__class__)

        columns_to_export = self._default_dict_fields
        columns_to_exclude = self._exclude_dict_fields
        include_private_fields = self._include_private_fields
        include_fields = self._include_dict_fields

        if len(fields):
            columns_to_export = fields

        for key in list(columns.keys()):
            # remove sensitive information like hashes
            if key in ['password', 'code', 'auth_token'] \
                    or key in columns_to_exclude \
                    or (key.startswith('_') and not include_private_fields) \
                    or (key.startswith('db_') and key not in include_fields):
                continue
            if columns_to_export and key not in columns_to_export:
                continue

            if key.startswith('_') and hasattr(self, key[1:]):
                is_private = True
                value = getattr(self, key[1:], None)
            else:
                is_private = False
                value = getattr(self, key, None)
            if is_private:
                # Remove underscore
                key = key[1:]
            if serialize:
                value = json_serializer(value)
            obj[key] = value

        for key in include_fields:
            value = getattr(self, key)
            if serialize:
                value = json_serializer(value)
            obj[key] = value

        return obj


Base = declarative_base(cls=BaseModel, name='BaseModel')
