import { describe, it } from "node:test";
import assert from "node:assert";
import {
  resolveCountryCode,
  POPULAR_COUNTRIES,
  COUNTRY_ALIAS_MAP,
} from "../../app/utils/country-directory";

describe("Unit Testing - Country Directory & Flag Resolver", () => {
  it("Task 1: Harus mengenali nama negara dalam Bahasa Inggris standar", () => {
    assert.strictEqual(resolveCountryCode("Australia").code, "au");
    assert.strictEqual(resolveCountryCode("Canada").code, "ca");
    assert.strictEqual(resolveCountryCode("Germany").code, "de");
    assert.strictEqual(resolveCountryCode("Japan").code, "jp");
    assert.strictEqual(resolveCountryCode("South Korea").code, "kr");
    assert.strictEqual(resolveCountryCode("France").code, "fr");
    assert.strictEqual(resolveCountryCode("United Kingdom").code, "gb");
    assert.strictEqual(resolveCountryCode("United States").code, "us");
    assert.strictEqual(resolveCountryCode("Netherlands").code, "nl");
    assert.strictEqual(resolveCountryCode("Switzerland").code, "ch");
  });

  it("Task 2: Harus mengenali alias nama negara dalam Bahasa Indonesia", () => {
    assert.strictEqual(resolveCountryCode("Jepang").code, "jp");
    assert.strictEqual(resolveCountryCode("Korea Selatan").code, "kr");
    assert.strictEqual(resolveCountryCode("Prancis").code, "fr");
    assert.strictEqual(resolveCountryCode("Belanda").code, "nl");
    assert.strictEqual(resolveCountryCode("Jerman").code, "de");
    assert.strictEqual(resolveCountryCode("Inggris").code, "gb");
    assert.strictEqual(resolveCountryCode("Amerika Serikat").code, "us");
    assert.strictEqual(resolveCountryCode("Swiss").code, "ch");
    assert.strictEqual(resolveCountryCode("Spanyol").code, "es");
    assert.strictEqual(resolveCountryCode("Tiongkok").code, "cn");
    assert.strictEqual(resolveCountryCode("Selandia Baru").code, "nz");
  });

  it("Task 3: Harus tahan terhadap spasi berlebih dan huruf besar/kecil", () => {
    assert.strictEqual(resolveCountryCode("   jApAn   ").code, "jp");
    assert.strictEqual(resolveCountryCode("JEPANG").code, "jp");
    assert.strictEqual(resolveCountryCode("   korea selatan ").code, "kr");
    assert.strictEqual(resolveCountryCode("uSa").code, "us");
    assert.strictEqual(resolveCountryCode("uK").code, "gb");
  });

  it("Task 4: Harus menangani input null, undefined, atau string kosong dengan fallback aman", () => {
    assert.strictEqual(resolveCountryCode(null).code, "au");
    assert.strictEqual(resolveCountryCode(undefined).code, "au");
    assert.strictEqual(resolveCountryCode("").code, "au");
    assert.strictEqual(resolveCountryCode("   ").code, "au");
  });

  it("Task 5: Harus menyediakan daftar negara populer dengan kode dan nama yang valid", () => {
    assert.ok(POPULAR_COUNTRIES.length >= 30);
    for (const country of POPULAR_COUNTRIES) {
      assert.strictEqual(typeof country.code, "string");
      assert.strictEqual(country.code.length, 2);
      assert.strictEqual(country.code, country.code.toLowerCase());
      assert.ok(country.nameEn.length > 0);
      assert.ok(country.nameId.length > 0);
    }
  });
});
