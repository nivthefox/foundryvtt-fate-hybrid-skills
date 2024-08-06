export class Approach extends foundry.abstract.DataModel {
    static defineSchema() {
        return {
            "name":new foundry.data.fields.StringField({ nullable: false, required: true, initial:""}),
            "description":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "overcome":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "caa":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "attack":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "defend":new foundry.data.fields.HTMLField({ nullable: false, required: true, initial:""}),
            "pc": new foundry.data.fields.BooleanField({ nullable: false, required: true, initial:true}),
            "rank": new foundry.data.fields.NumberField({ required: true, initial:0, integer:true }),
            "extra_id": new foundry.data.fields.StringField({ required: false, initial: undefined }),
            "original_name": new foundry.data.fields.StringField({ required: false, initial:undefined }),
            "adhoc": new foundry.data.fields.BooleanField({ required: false, initial:false }),
            "hidden": new foundry.data.fields.BooleanField({ required: false, initial:false }),
        }
    }
}
