import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Heading,
  VStack,
  Text,
  type UseDisclosureReturn,
} from "@chakra-ui/react";

import { useDataset } from "~/utils/hooks";
import { DeleteDatasetButton } from "./DeleteDatasetButton";
import PruningRulesEditor from "./PruningRulesEditor";

export default function DatasetConfigurationDrawer({
  disclosure,
}: {
  disclosure: UseDisclosureReturn;
}) {
  const dataset = useDataset().data;

  return (
    <Drawer placement="right" size="md" {...disclosure}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader bgColor="orange.50">
          <Heading size="md">Dataset Settings</Heading>
        </DrawerHeader>
        <DrawerBody h="full" pb={4} bgColor="orange.50">
          <VStack h="full" w="full" justifyContent="space-between">
            <VStack w="full" alignItems="flex-start" spacing={16}>
              <Text>
                These settings will only affect the <b>{dataset?.name}</b> dataset.
              </Text>
              <PruningRulesEditor />
            </VStack>
            <DeleteDatasetButton closeDrawer={disclosure.onClose} />
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
