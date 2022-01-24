# vanilla-multiselect-bootstrap5

This project is based on the project from Phillippe Meyer
https://github.com/PhilippeMarcMeyer/vanillaSelectBox 


Converted the code, to Bootstrap (5) styling, and can be use in with stimulus controller


```javascript
import { Controller } from '@hotwired/stimulus';
import { VanillaJsMultiSelectBox } from "vanillajs-muliti-select";

/**
 * Documentation https://github.com/jpvdw86/vanillajs-muliti-select
 * Usage:
 * <div class="col-12 col-md-4 col-xl-2">
 *     <label class="visually-hidden-focusable" for="selectboxExample">Example</label>
 *     <select data-controller="select-box" data-placeholder="Example-placeholder" multiple class="form-select" id="selectboxExample" name="values[]">
 *     <option value="1">1</option>
 *     <option value="2">2</option>
 *     <option value="3">3</option>
 *     </select>
 * </div>
 */
export default class extends Controller {
    selectBox
    translations = { "all": "Alles", "items": "items", "selectAll": "Selecteer alles", "clearAll": "Deselecteer alles" };


    connect() {
        this.selectBox = new VanillaSelectBox(this.element,
            {
                search:true,
                translations: this.translations,
                placeHolder: this.element.dataset.placeholder,
            }
        );
    }

}
```
