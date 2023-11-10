import openai as original_openai
from openai.openai_object import OpenAIObject
import time
import inspect
import json

from openpipe.merge_openai_chunks import merge_openai_chunks
from openpipe.api_client.api.default import create_chat_completion
from openpipe.api_client import errors

from .shared import (
    report_async,
    report,
    configured_client,
)


class WrappedChatCompletion(original_openai.ChatCompletion):
    @classmethod
    def create(cls, *args, **kwargs):
        openpipe_options = kwargs.pop("openpipe", {})

        requested_at = int(time.time() * 1000)
        model = kwargs.get("model", "")

        try:
            if model.startswith("openpipe:"):
                response = create_chat_completion.sync_detailed(
                    client=configured_client,
                    json_body=create_chat_completion.CreateChatCompletionJsonBody.from_dict(
                        kwargs,
                    ),
                )
                chat_completion = OpenAIObject.construct_from(
                    json.loads(response.content), api_key=None
                )
            else:
                chat_completion = original_openai.ChatCompletion.create(*args, **kwargs)

            if inspect.isgenerator(chat_completion):

                def _gen():
                    assembled_completion = None
                    for chunk in chat_completion:
                        assembled_completion = merge_openai_chunks(
                            assembled_completion, chunk
                        )

                        yield chunk

                    received_at = int(time.time() * 1000)

                    report(
                        openpipe_options=openpipe_options,
                        requested_at=requested_at,
                        received_at=received_at,
                        req_payload=kwargs,
                        resp_payload=assembled_completion,
                        status_code=200,
                    )

                return _gen()
            else:
                received_at = int(time.time() * 1000)

                report(
                    openpipe_options=openpipe_options,
                    requested_at=requested_at,
                    received_at=received_at,
                    req_payload=kwargs,
                    resp_payload=chat_completion,
                    status_code=200,
                )
            return chat_completion
        except Exception as e:
            received_at = int(time.time() * 1000)

            if isinstance(e, original_openai.OpenAIError):
                report(
                    openpipe_options=openpipe_options,
                    requested_at=requested_at,
                    received_at=received_at,
                    req_payload=kwargs,
                    resp_payload=e.json_body,
                    error_message=str(e),
                    status_code=e.http_status,
                )
            elif isinstance(e, errors.UnexpectedStatus):
                error_content = None
                error_message = ""
                try:
                    error_content = json.loads(e.content)
                    error_message = error_content.get("message", "")
                except:
                    pass

                report(
                    openpipe_options=openpipe_options,
                    requested_at=requested_at,
                    received_at=received_at,
                    req_payload=kwargs,
                    resp_payload=error_content,
                    error_message=error_message,
                    status_code=e.status_code,
                )
                raise Exception(error_message)

            raise e

    @classmethod
    async def acreate(cls, *args, **kwargs):
        openpipe_options = kwargs.pop("openpipe", {})

        requested_at = int(time.time() * 1000)
        model = kwargs.get("model", "")

        try:
            if model.startswith("openpipe:"):
                response = await create_chat_completion.asyncio_detailed(
                    client=configured_client,
                    json_body=create_chat_completion.CreateChatCompletionJsonBody.from_dict(
                        kwargs,
                    ),
                )
                chat_completion = OpenAIObject.construct_from(
                    json.loads(response.content), api_key=None
                )
            else:
                chat_completion = await original_openai.ChatCompletion.acreate(
                    *args, **kwargs
                )

            if inspect.isasyncgen(chat_completion):

                async def _gen():
                    assembled_completion = None
                    try:
                        async for chunk in chat_completion:
                            assembled_completion = merge_openai_chunks(
                                assembled_completion, chunk
                            )
                            yield chunk
                    finally:
                        try:
                            # This block will always execute when the generator exits.
                            # This ensures that cleanup and reporting operations are performed regardless of how the generator terminates.
                            received_at = int(time.time() * 1000)
                            await report_async(
                                openpipe_options=openpipe_options,
                                requested_at=requested_at,
                                received_at=received_at,
                                req_payload=kwargs,
                                resp_payload=assembled_completion,
                                status_code=200,
                            )
                        except Exception as e:
                            # Ignore any errors that occur while reporting
                            pass

                return _gen()
            else:
                received_at = int(time.time() * 1000)

                await report_async(
                    openpipe_options=openpipe_options,
                    requested_at=requested_at,
                    received_at=received_at,
                    req_payload=kwargs,
                    resp_payload=chat_completion,
                    status_code=200,
                )

            return chat_completion
        except Exception as e:
            received_at = int(time.time() * 1000)

            if isinstance(e, original_openai.OpenAIError):
                await report_async(
                    openpipe_options=openpipe_options,
                    requested_at=requested_at,
                    received_at=received_at,
                    req_payload=kwargs,
                    resp_payload=e.json_body,
                    error_message=str(e),
                    status_code=e.http_status,
                )
            elif isinstance(e, errors.UnexpectedStatus):
                error_content = None
                error_message = ""
                try:
                    error_content = json.loads(e.content)
                    error_message = error_content.get("message", "")
                except:
                    pass
                await report_async(
                    openpipe_options=openpipe_options,
                    requested_at=requested_at,
                    received_at=received_at,
                    req_payload=kwargs,
                    resp_payload=error_content,
                    error_message=error_message,
                    status_code=e.status_code,
                )
                raise Exception(error_message)

            raise e


class OpenAIWrapper:
    ChatCompletion = WrappedChatCompletion()

    def __getattr__(self, name):
        return getattr(original_openai, name)

    def __setattr__(self, name, value):
        return setattr(original_openai, name, value)
