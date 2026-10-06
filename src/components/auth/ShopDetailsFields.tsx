const inputClassName =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800";
const labelClassName = "grid gap-2 text-sm font-medium text-slate-700";

export function ShopDetailsFields() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={`${labelClassName} sm:col-span-2`}>
        Full name
        <input
          className={inputClassName}
          name="fullName"
          type="text"
          autoComplete="name"
          maxLength={120}
          required
        />
      </label>
      <label className={`${labelClassName} sm:col-span-2`}>
        Shop name
        <input
          className={inputClassName}
          name="shopName"
          type="text"
          autoComplete="organization"
          maxLength={120}
          required
        />
      </label>
      <label className={labelClassName}>
        Shop type
        <select
          className={inputClassName}
          name="shopType"
          defaultValue=""
          required
        >
          <option value="" disabled>
            Choose a type
          </option>
          <option value="pharmacy">Pharmacy</option>
          <option value="grocery">Grocery</option>
          <option value="restaurant">Restaurant</option>
        </select>
      </label>
      <label className={labelClassName}>
        Phone
        <input
          className={inputClassName}
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={32}
          required
        />
      </label>
      <label className={labelClassName}>
        WhatsApp
        <input
          className={inputClassName}
          name="whatsapp"
          type="tel"
          autoComplete="tel"
          maxLength={32}
          required
        />
      </label>
      <label className={`${labelClassName} sm:col-span-2`}>
        Address
        <input
          className={inputClassName}
          name="address"
          type="text"
          autoComplete="street-address"
          maxLength={300}
          required
        />
      </label>
      <label className={labelClassName}>
        Area
        <input
          className={inputClassName}
          name="area"
          type="text"
          autoComplete="address-level3"
          maxLength={120}
          required
        />
      </label>
      <label className={labelClassName}>
        City
        <input
          className={inputClassName}
          name="city"
          type="text"
          autoComplete="address-level2"
          maxLength={120}
          required
        />
      </label>
    </div>
  );
}
