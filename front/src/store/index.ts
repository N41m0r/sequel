import Vue from "vue";
import Vuex from "vuex";
import { http } from "@/core/http";
import { BASE_URL } from "@/appsettings";
import { ServerConnection } from "@/models/serverConnection";
import { DatabaseObjectNode } from "@/models/databaseObjectNode";
import { QueryExecutionContext } from "@/models/queryExecutionContext";
import { AppSnackbar } from "@/models/appSnackbar";
import { QueryTabContent } from "@/models/queryTabContent";
import { v4 as uuidv4 } from "uuid";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    appSnackbar: {} as AppSnackbar,
    servers: [] as ServerConnection[],
    activeServer: {} as ServerConnection,
    editServer: {} as ServerConnection,
    databases: [] as string[],
    activeDatabase: {} as string,
    nodes: [] as DatabaseObjectNode[],
    activeNode: {} as DatabaseObjectNode,
    activeQueryTab: {} as number,
    queryTabs: [] as QueryTabContent[]
  },
  getters: {
    activeEditor: state => state.queryTabs[state.activeQueryTab].editor
  },
  actions: {
    showAppSnackbar: (context, appSnackbar: AppSnackbar) => {
      appSnackbar.show = true;
      context.commit("setAppSnackbar", appSnackbar);
    },
    hideAppSnackbar: context => {
      context.commit("setAppSnackbar", { show: false } as AppSnackbar);
    },
    fetchServers: async context => {
      const servers = await http.get<ServerConnection[]>(`${BASE_URL}/sequel/server-connections`);
      context.commit("setServers", servers);
    },
    addServer: async (context, server: ServerConnection) => {
      await http.post<void>(`${BASE_URL}/sequel/server-connections`, server);
      context.dispatch("fetchServers");
      context.dispatch("showAppSnackbar", { message: "New database connection added.", color: "success" } as AppSnackbar);
    },
    deleteServer: async (context, serverId: number) => {
      await http.delete<void>(`${BASE_URL}/sequel/server-connections/${serverId}`);
      context.dispatch("fetchServers");
      context.dispatch("showAppSnackbar", { message: "Database connection deleted.", color: "success" } as AppSnackbar);
    },
    testServer: async (context, server: ServerConnection) => {
      await http.post<void>(`${BASE_URL}/sequel/server-connections/test`, server);
      context.dispatch("showAppSnackbar", { message: "Database connection succeeded.", color: "success" } as AppSnackbar);
    },
    changeActiveServer: (context, server: ServerConnection) => {
      context.commit("setActiveServer", server);
      context.dispatch("fetchDatabases", server);
    },
    changeEditServer: (context, server: ServerConnection) => {
      context.commit("setEditServer", server);
    },
    fetchDatabases: async context => {
      if (context.state.activeServer === undefined) {
        context.commit("setDatabases", []);
      } else {
        const databases = await http.post<string[]>(`${BASE_URL}/sequel/databases`, context.state.activeServer);
        context.commit("setDatabases", databases);
      }
      context.dispatch("changeActiveDatabase");
    },
    changeActiveDatabase: (context, database: string) => {
      context.commit("setActiveDatabase", database);
      context.dispatch("fetchDatabaseObjectNodes");
    },
    fetchDatabaseObjectNodes: async (context, parent: DatabaseObjectNode) => {
      if (context.state.activeDatabase === undefined) {
        context.commit("clearNodes");
      } else {
        const nodes = await http.post<DatabaseObjectNode[]>(`${BASE_URL}/sequel/database-objects`, {
          server: context.state.activeServer,
          database: context.state.activeDatabase,
          databaseObject: parent === undefined ? null : parent
        } as QueryExecutionContext);
        context.commit("pushNodes", { parent, nodes });
      }
    },
    changeActiveNode: (context, node: DatabaseObjectNode) => {
      context.commit("setActiveNode", node);
    },
    openNewQueryTab: context => {
      const num = Math.max(...context.state.queryTabs.map(x => x.num), 0) + 1;
      const index = context.state.queryTabs.length;
      context.commit("pushQueryTab", { id: uuidv4(), num, title: `query${num}` } as QueryTabContent);
      context.dispatch("changeActiveQueryTab", index);
    },
    closeQueryTab: (context, index: number) => {
      context.commit("removeQueryTab", index);
    },
    changeActiveQueryTab: (context, index: number) => {
      context.commit("setActiveQueryTab", index);
    },
    updateQueryTabContent: (context, tab: QueryTabContent) => {
      context.commit("mergeQueryTabContent", tab);
    }
  },
  mutations: {
    setAppSnackbar(state, appSnackbar: AppSnackbar) {
      state.appSnackbar = appSnackbar;
    },
    setServers(state, servers: ServerConnection[]) {
      state.servers = servers;
    },
    setActiveServer(state, server: ServerConnection) {
      state.activeServer = server;
    },
    setEditServer(state, server: ServerConnection) {
      state.editServer = server;
    },
    setDatabases(state, databases: string[]) {
      state.databases = databases;
    },
    setActiveDatabase(state, database: string) {
      state.activeDatabase = database;
    },
    clearNodes(state) {
      state.nodes = [];
    },
    pushNodes(state, { parent, nodes }) {
      if (parent === undefined) {
        state.nodes = nodes;
      } else {
        (parent as DatabaseObjectNode).children.push(...nodes);
      }
    },
    setActiveNode(state, node: DatabaseObjectNode) {
      state.activeNode = node;
    },
    pushQueryTab(state, queryTab: QueryTabContent) {
      state.queryTabs.push(queryTab);
    },
    removeQueryTab(state, index: number) {
      state.queryTabs.splice(index, 1);
    },
    setActiveQueryTab(state, index: number) {
      state.activeQueryTab = index;
    },
    mergeQueryTabContent(state, tab: QueryTabContent) {
      const tabToUpdate = state.queryTabs.find(x => x.id === tab.id);
      if (tabToUpdate) {
        tabToUpdate.editor = tab.editor;
      }
    }
  }
});
