import React, { createContext, useCallback, useContext, useState } from "react";

export type ContentType = "anime" | "manga";

interface ContentSettings {
  contentType: ContentType;
  isAdultMode: boolean;
  toggleContentType: () => void;
  toggleAdultMode: () => void;
}

const ContentSettingsContext = createContext<ContentSettings>({
  contentType: "anime",
  isAdultMode: false,
  toggleContentType: () => {},
  toggleAdultMode: () => {},
});

export function ContentSettingsProvider({ children }: { children: React.ReactNode }) {
  const [contentType, setContentType] = useState<ContentType>("anime");
  const [isAdultMode, setIsAdultMode] = useState(false);

  const toggleContentType = useCallback(() => {
    setContentType((c) => (c === "anime" ? "manga" : "anime"));
  }, []);

  const toggleAdultMode = useCallback(() => {
    setIsAdultMode((v) => !v);
  }, []);

  return (
    <ContentSettingsContext.Provider
      value={{ contentType, isAdultMode, toggleContentType, toggleAdultMode }}
    >
      {children}
    </ContentSettingsContext.Provider>
  );
}

export function useContentSettings() {
  return useContext(ContentSettingsContext);
}
