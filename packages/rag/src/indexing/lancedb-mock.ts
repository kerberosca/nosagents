// Implémentation simulée de LanceDB pour les tests
// En production, utilisez @lancedb/lancedb

export interface Connection {
  openTable(name: string): Promise<Table>;
  createTable(name: string, data: any[]): Promise<Table>;
  dropTable(name: string): Promise<void>;
  tableNames(): Promise<string[]>;
  close(): Promise<void>;
}

export interface Table {
  add(data: any[]): Promise<void>;
  search(query: any): Promise<any[]>;
  delete(filter: any): Promise<void>;
  count(): Promise<number>;
  schema(): Promise<any>;
}

export async function connect(uri: string): Promise<Connection> {
  console.log(`Mock LanceDB: Connecting to ${uri}`);
  
  const tables = new Map<string, any[]>();
  
  return {
    async openTable(name: string): Promise<Table> {
      console.log(`Mock LanceDB: Opening table ${name}`);
      const data = tables.get(name) || [];
      
      return {
        async add(newData: any[]): Promise<void> {
          data.push(...newData);
          tables.set(name, data);
          console.log(`Mock LanceDB: Added ${newData.length} records to ${name}`);
        },
        
        async search(query: any): Promise<any[]> {
          console.log(`Mock LanceDB: Searching in ${name} with query:`, query);
          // Recherche simulée basée sur le texte
          if (query.query && typeof query.query === 'string') {
            const results = data.filter((item: any) => 
              item.content && item.content.toLowerCase().includes(query.query.toLowerCase())
            ).map((item: any, index: number) => ({
              ...item,
              score: 1.0 - (index * 0.1), // Score simulé
            }));
            return results.slice(0, query.k || 10);
          }
          return data.slice(0, query.k || 10);
        },
        
        async delete(filter: any): Promise<void> {
          console.log(`Mock LanceDB: Deleting from ${name} with filter:`, filter);
          // Suppression simulée
          if (filter.id) {
            const index = data.findIndex((item: any) => item.id === filter.id);
            if (index !== -1) {
              data.splice(index, 1);
              tables.set(name, data);
            }
          }
        },
        
        async count(): Promise<number> {
          return data.length;
        },
        
        async schema(): Promise<any> {
          return {
            fields: [
              { name: 'id', type: 'string' },
              { name: 'content', type: 'string' },
              { name: 'metadata', type: 'object' },
              { name: 'embeddings', type: 'float32' },
            ]
          };
        }
      };
    },
    
    async createTable(name: string, data: any[]): Promise<Table> {
      console.log(`Mock LanceDB: Creating table ${name}`);
      tables.set(name, data);
      const connection = await this;
      return connection.openTable(name);
    },
    
    async dropTable(name: string): Promise<void> {
      console.log(`Mock LanceDB: Dropping table ${name}`);
      tables.delete(name);
    },
    
    async tableNames(): Promise<string[]> {
      return Array.from(tables.keys());
    },
    
    async close(): Promise<void> {
      console.log('Mock LanceDB: Closing connection');
    }
  };
}
