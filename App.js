import { useEffect } from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { registerForPushNotificationsAsync } from "./src/utils/notifications";

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return <RootNavigator />;
}
