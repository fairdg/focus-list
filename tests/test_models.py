import pytest

from Api.main import TaskAddSchema, serialize_task, TaskModel


def test_serialize_task_roundtrip() -> None:
    task = TaskModel(id=1, text="hello", completed=True)
    assert serialize_task(task) == {"id": 1, "text": "hello", "completed": True}


def test_task_add_schema_requires_text() -> None:
    with pytest.raises(ValueError):
        TaskAddSchema(text="", completed=False)
