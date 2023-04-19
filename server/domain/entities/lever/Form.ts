export class Form {
  id: string;
  type: string;
  text: string;
  instructions: string;
  baseTemplateId: string;
  fields?: FormFieldEntity[];
  user: string;
  stage: string;
  completedAt: number;
  deletedAt?: null;
  createdAt: number;
}

export const getFormField = function (form: Form, fieldName: string) {
  if (form) {
    let field = form.fields.find(x => x.text === fieldName);
    return field ?
      (
        field.value ?
          (
            typeof field.value === 'string' ?
              (
                field.value.trim() !== '' ?
                  field.value :
                  undefined
              ) :
              field.value
          ) :
          undefined) :
      undefined;
  } else
    return undefined;
};

export interface FormFieldEntity {
  description: string;
  required: boolean;
  text: string;
  type: string;
  value?: string;
  prompt?: string;
}
