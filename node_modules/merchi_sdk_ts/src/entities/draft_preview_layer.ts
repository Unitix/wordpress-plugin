import { Entity } from '../entity.js';
import { DraftPreview } from './draft_preview.js';
import { DraftTemplate } from './draft_template.js';

export class DraftPreviewLayer extends Entity {
  protected static resourceName = 'draft_preview_layers';
  protected static singularName = 'draftPreviewLayer';
  protected static pluralName = 'draftPreviewLayers';

  @DraftPreviewLayer.property()
  public id?: number;

  @DraftPreviewLayer.property({type: String})
  public layerName?: string;

  @DraftPreviewLayer.property({type: DraftPreview})
  public draftPreview?: DraftPreview;

  @DraftPreviewLayer.property({type: DraftTemplate})
  public draftTemplate?: DraftTemplate;
}
