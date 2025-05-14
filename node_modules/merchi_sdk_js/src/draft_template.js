import { addPropertyTo, serialise, create, enumerateFiles,
    fromJson } from './model.js';
import { Job } from './job.js';
import { Product } from './product.js';
import { MerchiFile } from './merchi_file.js';
import { VariationFieldsOption } from './variation_fields_option.js';
import { VariationField } from './variation_field.js';
import { DraftPreviewLayer } from './draft_preview_layer.js';

export function DraftTemplate() {
    this.resource = '/draft_comments';
    this.json = 'draftComment';

    addPropertyTo(this, 'id');
    addPropertyTo(this, 'product', Product);
    addPropertyTo(this, 'file', MerchiFile);
    addPropertyTo(this, 'design', MerchiFile);
    addPropertyTo(this, 'job', Job);
    addPropertyTo(this, 'selectedByVariationFieldOptions', VariationFieldsOption);
    addPropertyTo(this, 'editedByVariationFields', VariationField);
    addPropertyTo(this, 'date');
    addPropertyTo(this, 'name');
    addPropertyTo(this, 'description');
    addPropertyTo(this, 'height');
    addPropertyTo(this, 'width');
    addPropertyTo(this, 'draftPreviewLayer', DraftPreviewLayer);

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
