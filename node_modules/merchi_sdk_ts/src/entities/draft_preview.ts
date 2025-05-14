import { Entity } from '../entity.js';
import { MerchiFile } from './file.js';
import { Product } from './product.js';
import { DraftPreviewLayer } from './draft_preview_layer.js';

export class DraftPreview extends Entity {
  protected static resourceName = 'draft_previews';
  protected static singularName = 'draftPreview';
  protected static pluralName = 'draftPreviews';

  @DraftPreview.property()
  public id?: number;

  @DraftPreview.property({type: MerchiFile})
  public file?: MerchiFile;

  @DraftPreview.property({type: Product})
  public product?: Product;

  @DraftPreview.property({type: String})
  public description?: string | null;

  @DraftPreview.property({type: String})
  public name?: string | null;

  @DraftPreview.property({type: Date})
  public date?: Date | null;

  @DraftPreview.property()
  public height?: number;

  @DraftPreview.property()
  public width?: number;

  @DraftPreview.property({arrayType: 'DraftPreviewLayer'})
  public draftPreviewLayers?: DraftPreviewLayer[];
}
