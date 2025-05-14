import { addPropertyTo, serialise, create, enumerateFiles,
    fromJson } from './model.js';
import { DraftPreview } from './draft_preview.js';
import { DraftTemplate } from './draft_template.js';

export function DraftPreviewLayer() {
    this.resource = '/draft_previews';
    this.json = 'draftPreview';

    addPropertyTo(this, 'id');
    addPropertyTo(this, 'layerName');
    addPropertyTo(this, 'draftPreview', DraftPreview);
    addPropertyTo(this, 'draftTemplate', DraftTemplate);

    this.create = function (options) {
        var data = serialise(this),
            self = this;
        function handleResponse(result) {
            options.success(fromJson(self, result[self.json]));
        }
        create({resource: this.resource,
                parameters: data[0],
                files: enumerateFiles(data[1]),
                success: handleResponse,
                as_domain: options.as_domain,
                error: options.error,
                embed: options.embed});
    };
}
