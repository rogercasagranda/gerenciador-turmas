import {
  type AnoLetivo,
  type AnoLetivoPayload,
  listAnosLetivos,
  createAnoLetivo,
  updateAnoLetivo,
  deleteAnoLetivo,
} from './api'

export type { AnoLetivo, AnoLetivoPayload }

export {
  listAnosLetivos,
  createAnoLetivo,
  updateAnoLetivo,
  deleteAnoLetivo,
  listAnosLetivos as getAnoLetivos,
}
