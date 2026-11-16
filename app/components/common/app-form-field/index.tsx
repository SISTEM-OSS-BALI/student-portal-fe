"use client";

import React, { forwardRef } from "react";
import {
  Checkbox,
  DatePicker,
  Input,
  InputNumber,
  Radio,
  Select,
  Upload,
} from "antd";
import type { QuestionDataModel } from "@/app/models/question";
import { isAllowedUploadSize } from "@/app/utils/upload";
import {
  cleanOptionLabel,
  cleanPlaceholder,
} from "@/app/utils/placeholder-sanitizer";
import { toDayjsOrUndefined } from "@/app/utils/personal-info-submissions";
import styles from "./app-form-field.module.css";

const { TextArea } = Input;

export interface AppFormFieldProps {
  question: QuestionDataModel;
  disabled?: boolean;
  value?: any;
  onChange?: (value: any) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  disabledDate?: (current: any) => boolean;
}

export const AppFormField = forwardRef<any, AppFormFieldProps>(
  function AppFormField(
    {
      question,
      disabled = false,
      value,
      onChange,
      className = "",
      style,
      placeholder: overridePlaceholder,
      disabledDate,
      ...restProps
    },
    ref,
  ) {
    const options =
      question.options?.map((option) => ({
        label: cleanOptionLabel(option.label),
        value: option.id ?? option.value,
      })) ?? [];

    const placeholder =
      overridePlaceholder !== undefined
        ? overridePlaceholder
        : cleanPlaceholder(question.placeholder);

    switch (question.input_type) {
      case "TEXTAREA":
        return (
          <TextArea
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            autoSize={{ minRows: 4, maxRows: 12 }}
            placeholder={placeholder}
            className={`${styles.textarea} ${className}`.trim()}
            style={style}
            {...restProps}
          />
        );

      case "NUMBER":
        return (
          <InputNumber
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder || undefined}
            className={`${styles.inputNumber} ${className}`.trim()}
            style={{ width: "100%", ...style }}
            {...restProps}
          />
        );

      case "EMAIL":
        return (
          <Input
            ref={ref}
            type="email"
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`${styles.input} ${className}`.trim()}
            style={style}
            {...restProps}
          />
        );

      case "PHONE":
        return (
          <Input
            ref={ref}
            type="tel"
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`${styles.input} ${className}`.trim()}
            style={style}
            {...restProps}
          />
        );

      case "DATE":
        return (
          <DatePicker
            ref={ref}
            value={toDayjsOrUndefined(value)}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder || "Pilih tanggal"}
            className={`${styles.datePicker} ${className}`.trim()}
            style={{ width: "100%", ...style }}
            disabledDate={disabledDate}
            {...restProps}
          />
        );

      case "SELECT":
        return (
          <Select
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder || "Pilih opsi"}
            options={options}
            className={`${styles.select} ${className}`.trim()}
            style={{ width: "100%", ...style }}
            {...restProps}
          />
        );

      case "RADIO":
        return (
          <Radio.Group
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            options={options}
            className={`${styles.radioGroup} ${className}`.trim()}
            style={style}
            {...restProps}
          />
        );

      case "CHECKBOX":
        return (
          <Checkbox.Group
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            options={options}
            className={`${styles.checkboxGroup} ${className}`.trim()}
            style={style}
            {...restProps}
          />
        );

      case "FILE":
        return (
          <Upload
            disabled={disabled}
            beforeUpload={(file) => {
              if (!isAllowedUploadSize(file as File)) {
                return Upload.LIST_IGNORE;
              }
              return false;
            }}
            maxCount={1}
          >
            <Input
              ref={ref}
              placeholder="Upload file"
              readOnly
              className={`${styles.input} ${className}`.trim()}
              style={style}
            />
          </Upload>
        );

      case "TEXT":
      default:
        return (
          <Input
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`${styles.input} ${className}`.trim()}
            style={style}
            {...restProps}
          />
        );
    }
  },
);

AppFormField.displayName = "AppFormField";

export default AppFormField;
