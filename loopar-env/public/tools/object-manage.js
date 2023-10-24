class ObjectManage {
   constructor(options) {
   }

   append_child(opts) {
      const child = opts.child || null;
      if (!child) return;

      if (this.has_child(opts.name)) {
         //if (exist_f) exist_f(this["#" + child.name]);
      } else {
         this["#" + opts.name] = child;
      }

      return this.get_child(opts.name);
   }

   has_child(child) {
      return this["#" + child] || null;
   }

   get children() {
      const children = Object.assign({}, this);
      return children && typeof children == 'object' ? children : {};
   }

   el(el) {
      return this.get_child(el);
   }

   get_child(child) {
      return this["#" + child] || null;
   }

   in_children(f) {
      const children = this.children;
      let index = 0;

      if (Array.isArray(children)) {
         children.forEach((child, key) => {
            f(child, key, index);
            index++;
         });
      } else {
         Object.keys(children).forEach(key => {
            f(children[key], key, index);
            index++;
         });
      }
   }

   delete_child(child) {
      if (this.has_child(child)) delete this["#" + child];
   }

   is_obj(obj) {
      return ["object", "function"].includes(typeof obj) && obj != null && !["undefined", "string"].includes(typeof obj);
   }

   in_object(obj, f) {
      if (this.is_obj(obj)) {
         try {

            Object.keys(obj).forEach((key) => {
               if (obj.hasOwnProperty(key)) {
                  f(obj[key], key);
               }
            });
         } catch (e) {
            console.log(e);
         }
      }
   }

   array_contact(arr1, arr2) {
      return arr1.concat(arr2.filter((item) => arr1.indexOf(item) < 0));
   }

   merge_text(base_text, new_text, key = "") {
      if (["object", "function", "undefined", "boolean"].includes(typeof new_text)) return base_text;

      if (['content', 'label'].includes(key)) {
         return new_text
      } else {
         return ((['element', 'tagName'].includes(key) || base_text === new_text) ? "" : base_text + " ") + new_text;
      }
   }

   purify_array(arr) {
      let last_item = null;
      this.in_object(arr, (t, index) => {
         if (t === last_item) {
            delete arr[index];
         }
      })

      return arr;
   }

   purify_text(text) {
      return text || "";
      let sp = text.toString().split("::only->");
      return (sp[0] === "" ? text : sp.pop());
   }

   purify_content(obj) {
      if (obj == null || typeof obj == 'undefined') return obj;

      if (typeof obj == "string") return this.purify_text(obj);

      if (obj.typeof === "JSHtml") {
         obj.content = this.purify_content(obj.content);
         obj.props = this.purify_content(obj.props);

         if (obj["make_attributes"]) obj.make_attributes();
      } else {
         this.in_object(obj, (item, key) => {
            if (typeof item == 'object') {
               obj[key] = this.purify_content(item);
            } else {
               obj[key] = this.purify_text(item);
            }
         })
      }

      return obj;
   }

   merge_obj(base, obj1, obj2, k = null) {
      if (this.is_obj(obj1) && this.is_obj(obj2)) {
         if (Array.isArray(obj1) && Array.isArray(obj2)) {
            return this.array_contact(obj1, obj2);
         } else {
            this.in_object(obj2, (obj, key) => {
               if (this.is_obj(obj) && !Array.isArray(obj) && obj.typeof === 'JSHtml') {
                  obj.reset_listeners ? obj.reset_listeners() : null;
               }

               if (obj1.hasOwnProperty(key)) {
                  if (typeof obj == "string") {
                     if (obj1.typeof === "JSHtml" && key === "content" && !["class", "style"].includes(key)) {
                        obj1.empty().content = clone(obj);
                     } else {
                        base[key] = this.merge_text(obj1[key], obj, key);
                        //obj1[key] = this.merge_obj(obj1[key], obj, key);
                     }
                  } else {
                     base[key] = this.merge_obj(obj1[key], obj, key);
                  }
               } else {
                  base[key] = obj;
               }
            });
         }
      } else if (typeof obj1 == "string" && typeof obj2 == "string") {
         base = this.merge_text(obj1, obj2, k);
      } else if (this.is_obj(obj2)) {
         base = Object.assign({}, obj2);
      } else if (this.is_obj(obj1)) {
         if (Array.isArray(obj1)) {
            base.push(Object.assign({}, obj2));
         } else {
            Object.assign(base, obj1, { new_value: obj2 });
         }
      }

      return base;
   }

   assign(base, obj1 = {}, obj2 = {}) {
      let fix = this.merge_obj(base, Object.assign({}, obj1), Object.assign({}, obj2));
      return this.purify_content(fix);
   }
}

export const object_manage = new ObjectManage();