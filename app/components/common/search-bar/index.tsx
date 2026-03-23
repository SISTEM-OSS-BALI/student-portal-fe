import Search from "antd/es/input/Search";

interface SearchProps {
  placeholder: string;
  handleSearch?: (value: string) => void;
  handleChange?: (value: string) => void;
}

export default function SearchBarComponent({
  placeholder,
  handleSearch,
  handleChange,
}: SearchProps) {
  return (
    <div>
      <Search
        placeholder={placeholder}
        allowClear
        enterButton="Search"
        size="large"
        onSearch={handleSearch}
        onChange={(event) => handleChange?.(event.target.value)}
      />
    </div>
  );
}
