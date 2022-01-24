# vanilla-multiselect-bootstrap5

This project is based on the project from Phillippe Meyer
https://github.com/PhilippeMarcMeyer/vanillaSelectBox 


Converted the code, to Bootstrap (5) styling, and can be use in with stimulus controller


```javascript
import { Controller } from '@hotwired/stimulus';
import { VanillaMultiSelectBox } from "vanillaSelectBox";

/**
 * Documentation https://github.com/PhilippeMarcMeyer/vanillaSelectBox
 * Usage:
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
