from typing import TYPE_CHECKING, Any, Dict, Type, TypeVar, Union

from attrs import define

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.create_chat_completion_json_body_tools_item_function_parameters import (
        CreateChatCompletionJsonBodyToolsItemFunctionParameters,
    )


T = TypeVar("T", bound="CreateChatCompletionJsonBodyToolsItemFunction")


@define
class CreateChatCompletionJsonBodyToolsItemFunction:
    """
    Attributes:
        name (str):
        parameters (CreateChatCompletionJsonBodyToolsItemFunctionParameters):
        description (Union[Unset, str]):
    """

    name: str
    parameters: "CreateChatCompletionJsonBodyToolsItemFunctionParameters"
    description: Union[Unset, str] = UNSET

    def to_dict(self) -> Dict[str, Any]:
        name = self.name
        parameters = self.parameters.to_dict()

        description = self.description

        field_dict: Dict[str, Any] = {}
        field_dict.update(
            {
                "name": name,
                "parameters": parameters,
            }
        )
        if description is not UNSET:
            field_dict["description"] = description

        return field_dict

    @classmethod
    def from_dict(cls: Type[T], src_dict: Dict[str, Any]) -> T:
        from ..models.create_chat_completion_json_body_tools_item_function_parameters import (
            CreateChatCompletionJsonBodyToolsItemFunctionParameters,
        )

        d = src_dict.copy()
        name = d.pop("name")

        parameters = CreateChatCompletionJsonBodyToolsItemFunctionParameters.from_dict(d.pop("parameters"))

        description = d.pop("description", UNSET)

        create_chat_completion_json_body_tools_item_function = cls(
            name=name,
            parameters=parameters,
            description=description,
        )

        return create_chat_completion_json_body_tools_item_function
