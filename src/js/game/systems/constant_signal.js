import { ConstantSignalComponent } from "../components/constant_signal";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { Entity } from "../entity";
import { DialogWithForm } from "../../core/modal_dialog_elements";
import { FormElementInput } from "../../core/modal_dialog_forms";
import { enumColors } from "../colors";
import { ColorItem } from "../items/color_item";
import trim from "trim";
import { BOOL_TRUE_SINGLETON, BOOL_FALSE_SINGLETON } from "../items/boolean_item";
import { ShapeDefinition } from "../shape_definition";
import { ShapeItem } from "../items/shape_item";

export class ConstantSignalSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [ConstantSignalComponent]);

        this.root.signals.entityManuallyPlaced.add(this.querySigalValue, this);
    }

    update() {
        // Set signals
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const pinsComp = entity.components.WiredPins;
            const signalComp = entity.components.ConstantSignal;
            pinsComp.slots[0].value = signalComp.signal;
        }
    }

    /**
     * Asks the entity to enter a valid signal code
     * @param {Entity} entity
     */
    querySigalValue(entity) {
        if (!entity.components.ConstantSignal) {
            return;
        }

        // Ok, query, but also save the uid because it could get stale
        const uid = entity.uid;

        const signalValueInput = new FormElementInput({
            id: "markerName",
            label: null,
            placeholder: "",
            defaultValue: "",
            validator: val => this.parseSignalCode(val),
        });
        const dialog = new DialogWithForm({
            app: this.root.app,
            title: "Set Signal",
            desc: "Enter a shape code, color or '0' or '1'",
            formElements: [signalValueInput],
            buttons: ["cancel", "ok:good"],
        });
        this.root.hud.parts.dialogs.internalShowDialog(dialog);
        dialog.buttonSignals.ok.add(() => {
            if (!this.root || !this.root.entityMgr) {
                // Game got stopped
                return;
            }

            const entityRef = this.root.entityMgr.findByUid(uid, false);
            if (!entityRef) {
                // outdated
                return;
            }

            const constantComp = entityRef.components.ConstantSignal;
            if (!constantComp) {
                // no longer interesting
                return;
            }

            constantComp.signal = this.parseSignalCode(signalValueInput.getValue());
        });
    }

    parseSignalCode(code) {
        code = trim(code);
        if (enumColors[code]) {
            return new ColorItem(code);
        }
        if (code === "1" || code === "true") {
            return BOOL_TRUE_SINGLETON;
        }

        if (code === "0" || code === "false") {
            return BOOL_FALSE_SINGLETON;
        }

        if (ShapeDefinition.isValidShortKey(code)) {
            return new ShapeItem(this.root.shapeDefinitionMgr.getShapeFromShortKey(code));
        }

        return null;
    }
}
