# vanilla-multiselect-bootstrap5

This project is based on the project from Phillippe Meyer
https://github.com/PhilippeMarcMeyer/vanillaSelectBox 


Converted the code, to Bootstrap (5) styling, and can be use in with stimulus controller


```javascript
/** multi-select_controller.js */
import { Controller } from '@hotwired/stimulus';
import { VanillaJsMultiSelectBox } from "vanillajs-multi-select";

/**
 * Documentation https://github.com/jpvdw86/vanillajs-multi-select
 * Usage:
 * 
 * //size = "amount of items, when to see the counter"
 * //data-placeHolder = "Default placeholder"
 * 
 * <div class="col-12 col-md-4 col-xl-2">
 *     <label class="visually-hidden-focusable" for="selectboxExample">Example</label>
 *     <select data-controller="multi-select" data-placeholder="Example-placeholder" multiple class="form-select" id="selectboxExample" name="values[]" size="3">
 *     <option value="1">1</option>
 *     <option value="2">2</option>
 *     <option value="3">3</option>
 *     </select>
 * </div>
 */
export default class extends Controller {
    multiSelect
    translations = { "all": "Alles", "items": "geselecteerd", "selectAll": "Selecteer alles", "clearAll": "Deselecteer alles" };


    connect() {
        this.multiSelect = new VanillaSelectBox(this.element,
            {
                search:true,
                translations: this.translations,
                placeHolder: this.element.dataset.placeholder,
            }
        );
    }
}
```
