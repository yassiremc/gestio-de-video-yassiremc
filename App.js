import React, { createContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

import MainMenu from "./MainMenu";
import AddUrlScreen from "./AddUrlScreen";
import SelectListScreen from "./SelectListScreen";
import ListDetailScreen from "./ListDetailScreen";
import VideoPlayerScreen from "./VideoPlayerScreen";

export const VideoContext = createContext();

const Stack = createNativeStackNavigator();
const STORAGE_KEY = "myvideos_lists_v1";

const defaultLists = [{ id: "favourites", name: "Favourites", videos: [] }];

export default function App() {
  const [lists, setListsState] = useState(defaultLists);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadLists = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setListsState(parsed);
          }
        }
      } catch (error) {
        console.log("Error loading local lists:", error);
      } finally {
        setReady(true);
      }
    };

    loadLists();
  }, []);

  const setLists = (valueOrUpdater) => {
    setListsState((prev) => {
      const next =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(prev)
          : valueOrUpdater;

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((error) => {
        console.log("Error saving local lists:", error);
      });

      return next;
    });
  };

  const contextValue = useMemo(() => ({ lists, setLists, ready }), [lists, ready]);

  return (
    <VideoContext.Provider value={contextValue}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainMenu" component={MainMenu} />
            <Stack.Screen name="AddUrl" component={AddUrlScreen} />
            <Stack.Screen name="SelectList" component={SelectListScreen} />
            <Stack.Screen name="ListDetail" component={ListDetailScreen} />
            <Stack.Screen name="Player" component={VideoPlayerScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </VideoContext.Provider>
  );
}
