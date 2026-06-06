import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("appConfig", {
  name: "{{projectName}}",
  version: "0.1.0",
});
