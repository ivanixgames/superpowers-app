import * as ResizeHandle from "resize-handle";
import * as TreeView from "dnd-tree-view";
import { InfoDialog, ConfirmDialog } from "simple-dialogs";

import AddAddOrEditServerDialog from "./dialogs/AddOrEditServerDialog";
import * as settings from "./settings";
import * as panes from "./panes";

const sidebarElt = document.querySelector(".sidebar");
new ResizeHandle(document.querySelector(".sidebar") as HTMLDivElement, "left");

const addServerBtn = document.querySelector(".add-server") as HTMLButtonElement;
const editServerBtn = document.querySelector(".edit-server") as HTMLButtonElement;
const removeServerBtn = document.querySelector(".remove-server") as HTMLButtonElement;

const serversTreeView = new TreeView(document.querySelector(".servers-tree-view") as HTMLElement, { dropCallback: onServerDrop });

export function start() {
  for (const serverEntry of settings.favoriteServers) addServer(serverEntry);
  addServerBtn.disabled = false;
}

addServerBtn.addEventListener("click", onAddServerClick);
editServerBtn.addEventListener("click", onEditServerClick);
removeServerBtn.addEventListener("click", onRemoveServerClick);

serversTreeView.on("selectionChange", updateSelectedServer);
serversTreeView.on("activate", onServerActivate);

function onAddServerClick(event: MouseEvent) {
  const addOrEditOptions = {
    validationLabel: "Add",
    initialHostnameValue: "127.0.0.1",
    initialPortValue: "4237",
    initialLabelValue: ""
  };

  new AddAddOrEditServerDialog("Enter the server details", addOrEditOptions, (newServer: ServerEntry) => {
    if (newServer == null) return;

    let id = 0;
    for (const server of settings.favoriteServers) id = Math.max(id, parseInt(server.id, 10) + 1);
    newServer.id = id.toString();

    addServer(newServer);
    settings.favoriteServers.push(newServer);
    settings.favoriteServersById[newServer.id] = newServer;
    settings.scheduleSave();
  });
}

function onEditServerClick(event: MouseEvent) {
  const serverId = parseInt(serversTreeView.selectedNodes[0].dataset["serverId"], 10);
  const serverEntry = settings.favoriteServersById[serverId];

  const addOrEditOptions = {
    validationLabel: "Edit",
    initialHostnameValue: serverEntry.hostname,
    initialPortValue: serverEntry.port,
    initialLabelValue: serverEntry.label
  };
  new AddAddOrEditServerDialog("Edit the server details", addOrEditOptions, (updatedEntry) => {
    if (updatedEntry == null) return;

    serverEntry.hostname = updatedEntry.hostname;
    serverEntry.port = updatedEntry.port;
    serverEntry.label = updatedEntry.label;

    const selectedServerElt = serversTreeView.treeRoot.querySelector(`li[data-server-id="${serverId}"]`);
    const host = serverEntry.hostname + (serverEntry.port != null ? `:${serverEntry.port}` : "");
    selectedServerElt.querySelector(".host").textContent = host;
    selectedServerElt.querySelector(".label").textContent = serverEntry.label;

    settings.scheduleSave();
  });
}

function onRemoveServerClick(event: MouseEvent) {
  new ConfirmDialog("Are you sure you want to remove the server?", { validationLabel: "Remove" }, (confirm) => {
    if (!confirm) return;

    const selectedServerId = serversTreeView.selectedNodes[0].dataset["serverId"];
    const selectedServerElt = serversTreeView.treeRoot.querySelector(`li[data-server-id="${selectedServerId}"]`);
    serversTreeView.treeRoot.removeChild(selectedServerElt);

    const favoriteServer = settings.favoriteServersById[selectedServerId];
    delete settings.favoriteServersById[selectedServerId];
    settings.favoriteServers.splice(settings.favoriteServers.indexOf(favoriteServer), 1);

    settings.scheduleSave();
  });
}

function addServer(serverEntry: ServerEntry) {
  const serverElt = document.createElement("li");
  serverElt.dataset["serverId"] = serverEntry.id;
  serversTreeView.append(serverElt, "item");

  const hostElt = document.createElement("span");
  hostElt.classList.add("host");

  const host = serverEntry.hostname + (serverEntry.port != null ? `:${serverEntry.port}` : "");
  hostElt.textContent = host;
  serverElt.appendChild(hostElt);

  const labelElt = document.createElement("span");
  labelElt.classList.add("label");
  labelElt.textContent = serverEntry.label;
  serverElt.appendChild(labelElt);
}

function onServerDrop(dropInfo: { target: HTMLLIElement; where: string; }, orderedNodes: HTMLLIElement[]) {
  // TODO
  return false;
}

function updateSelectedServer() {
  if (serversTreeView.selectedNodes.length === 0) {
    editServerBtn.disabled = true;
    removeServerBtn.disabled = true;
  } else {
    editServerBtn.disabled = false;
    removeServerBtn.disabled = false;
  }
}

function onServerActivate() {
  if (serversTreeView.selectedNodes.length === 0) return;

  const serverId = serversTreeView.selectedNodes[0].dataset["serverId"];
  panes.openServer(settings.favoriteServersById[serverId]);
}