/* global dat */

export function initGui(worldState) {
  const gui = new dat.GUI();

  return gui;
}

export function guiObjectFolder(
  gui,
  name,
  component,
  skipKeys = [],
  open = false
) {
  const folder = gui.addFolder(name);
  guiObject(folder, component, skipKeys);
  if (open) {
    folder.open();
  }
  return [folder, component];
}

export function guiObject(folder, component, skipKeys = []) {
  Object.keys(component)
    .filter(
      (key) =>
        component[key] !== null &&
        typeof component[key] !== "object" &&
        typeof component[key] !== "array" &&
        !skipKeys.includes(key) &&
        !key.startsWith("_")
    )
    .forEach((key) => folder.add(component, key).listen());
}
