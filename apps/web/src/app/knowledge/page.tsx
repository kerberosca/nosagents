import { AdvancedKnowledgeManager } from '@/components/knowledge/advanced-knowledge-manager'
import { Button } from '@/components/ui/button'
import { Upload, Plus } from 'lucide-react'

export default function KnowledgePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Connaissances</h1>
          <p className="text-muted-foreground">
            Gérez vos packs de connaissances et documents
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importer
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau pack
          </Button>
        </div>
      </div>
      
      <AdvancedKnowledgeManager />
    </div>
  )
}
