import { Router, Request, Response } from 'express'
import { systemConfigService, SystemConfigData } from '../services/system-config-service'

const router = Router()

/**
 * GET /api/system-config
 * Récupère la configuration système complète
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const config = await systemConfigService.getSystemConfig()
    res.json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration système:', error)
    res.status(500).json({
      success: false,
      error: 'Impossible de récupérer la configuration système'
    })
  }
})

/**
 * PUT /api/system-config
 * Met à jour la configuration système complète
 */
router.put('/', async (req: Request, res: Response) => {
  try {
    const updates: Partial<SystemConfigData> = req.body
    
    // Validation basique
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Configuration invalide'
      })
    }

    const updatedConfig = await systemConfigService.updateSystemConfig(updates)
    
    res.json({
      success: true,
      data: updatedConfig,
      message: 'Configuration système mise à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la configuration système:', error)
    res.status(500).json({
      success: false,
      error: 'Impossible de mettre à jour la configuration système'
    })
  }
})

/**
 * GET /api/system-config/:section
 * Récupère une section spécifique de la configuration
 */
router.get('/:section', async (req: Request, res: Response) => {
  try {
    const { section } = req.params
    
    if (!['ollama', 'database', 'security', 'performance', 'logging'].includes(section)) {
      return res.status(400).json({
        success: false,
        error: 'Section de configuration invalide'
      })
    }

    const configSection = await systemConfigService.getConfigSection(section as keyof SystemConfigData)
    
    res.json({
      success: true,
      data: configSection
    })
  } catch (error) {
    console.error(`Erreur lors de la récupération de la section ${req.params.section}:`, error)
    res.status(500).json({
      success: false,
      error: 'Impossible de récupérer la section de configuration'
    })
  }
})

/**
 * PUT /api/system-config/:section
 * Met à jour une section spécifique de la configuration
 */
router.put('/:section', async (req: Request, res: Response) => {
  try {
    const { section } = req.params
    const updates = req.body
    
    if (!['ollama', 'database', 'security', 'performance', 'logging'].includes(section)) {
      return res.status(400).json({
        success: false,
        error: 'Section de configuration invalide'
      })
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Données de mise à jour invalides'
      })
    }

    const updatedSection = await systemConfigService.updateConfigSection(
      section as keyof SystemConfigData, 
      updates
    )
    
    res.json({
      success: true,
      data: updatedSection,
      message: `Section ${section} mise à jour avec succès`
    })
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la section ${req.params.section}:`, error)
    res.status(500).json({
      success: false,
      error: 'Impossible de mettre à jour la section de configuration'
    })
  }
})

/**
 * POST /api/system-config/reset
 * Réinitialise la configuration aux valeurs par défaut
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    // Invalider le cache
    systemConfigService.invalidateCache()
    
    // Supprimer la configuration actuelle
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    await prisma.systemConfig.deleteMany({
      where: { id: 'system' }
    })
    
    await prisma.$disconnect()
    
    // Récupérer la nouvelle configuration par défaut
    const defaultConfig = await systemConfigService.getSystemConfig()
    
    res.json({
      success: true,
      data: defaultConfig,
      message: 'Configuration réinitialisée aux valeurs par défaut'
    })
  } catch (error) {
    console.error('Erreur lors de la réinitialisation de la configuration:', error)
    res.status(500).json({
      success: false,
      error: 'Impossible de réinitialiser la configuration'
    })
  }
})

export default router
