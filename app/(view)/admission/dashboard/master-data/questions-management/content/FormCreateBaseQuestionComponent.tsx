import { useCountriesManagement } from "@/app/hooks/use-country-management";
import { QuestionBasePayloadCreateModel } from "@/app/models/question";
import { Button, Form, Input, InputNumber, Select, Switch } from "antd";

const { TextArea } = Input;

interface FormCreateBaseQuestionComponentProps {
  onFinish: (values: QuestionBasePayloadCreateModel) => void;
  initialValues?: QuestionBasePayloadCreateModel;
  submitLabel?: string;
  loading?: boolean;
}

export default function FormCreateBaseQuestionComponent({
  onFinish,
  initialValues,
  submitLabel = "Submit",
  loading = false,
}: FormCreateBaseQuestionComponentProps) {
  const [form] = Form.useForm<QuestionBasePayloadCreateModel>();
  const { data: countryData, fetchLoading: countryLoading } =
    useCountriesManagement({});

  const countryOptions =
    countryData?.map((country) => ({
      label: country.name,
      value: country.id,
    })) ?? [];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={initialValues}
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Please input the question name!" }]}
      >
        <Input placeholder="Enter question name" />
      </Form.Item>

      <Form.Item label="Description" name="desc">
        <TextArea placeholder="Enter description" rows={4} />
      </Form.Item>

      <Form.Item
        label="Type (Country)"
        name="country_id"
        rules={[{ required: true, message: "Please select the country!" }]}
      >
        <Select
          placeholder="Select country"
          options={countryOptions}
          showSearch
          optionFilterProp="label"
          loading={countryLoading}
          onChange={(_, option) => {
            const selectedLabel = Array.isArray(option)
              ? option[0]?.label
              : option?.label;
            form.setFieldsValue({
              type_country:
                typeof selectedLabel === "string" ? selectedLabel : undefined,
            });
          }}
        />
      </Form.Item>

      <Form.Item
        name="type_country"
        hidden
        rules={[{ required: true, message: "Type is required." }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Allow Multiple Submissions"
        name="allow_multiple_submissions"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item label="Active" name="active" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item label="Version" name="version">
        <InputNumber min={1} style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {submitLabel}
        </Button>
      </Form.Item>
    </Form>
  );
}
