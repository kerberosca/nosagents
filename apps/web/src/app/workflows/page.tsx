'use client'

import { WorkflowEditor } from '@/components/workflows/workflow-editor'
import { WorkflowVisualEditor } from '@/components/workflows/workflow-visual-editor'
import { Button } from '@/components/ui/button'
import { Eye, Code } from 'lucide-react'
import { useState } from 'react'

export default function WorkflowsPage() {
  const [viewMode, setViewMode] = useState<'editor' | 'visual'>('editor')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Orchestrez vos agents pour des tâches complexes
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'editor' ? 'default' : 'outline'}
            onClick={() => setViewMode('editor')}
          >
            <Code className="h-4 w-4 mr-2" />
            Éditeur
          </Button>
          <Button
            variant={viewMode === 'visual' ? 'default' : 'outline'}
            onClick={() => setViewMode('visual')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visuel
          </Button>
        </div>
      </div>
      
      {viewMode === 'editor' ? <WorkflowEditor /> : <WorkflowVisualEditor />}
    </div>
  )
}
