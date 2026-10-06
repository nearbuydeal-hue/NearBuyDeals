type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type AppRole = "customer" | "shop_owner" | "admin";
export type ShopType = "pharmacy" | "grocery" | "restaurant";
export type ShopApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";
export type ListingStatus = "active" | "sold_out" | "expired" | "removed";
export type NotifyContactMethod = "phone" | "whatsapp" | "email";
export type NotifyRequestStatus = "pending" | "fulfilled" | "cancelled";
export type ShopContactType = "phone" | "whatsapp";

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: AppRole;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        }
      >;
      shops: Table<
        {
          id: string;
          owner_id: string;
          name: string;
          shop_type: ShopType;
          description: string | null;
          phone: string;
          whatsapp: string | null;
          address: string;
          area: string;
          city: string;
          latitude: number | null;
          longitude: number | null;
          approval_status: ShopApprovalStatus;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          owner_id?: string;
          name: string;
          shop_type: ShopType;
          description?: string | null;
          phone: string;
          whatsapp?: string | null;
          address: string;
          area: string;
          city: string;
          latitude?: number | null;
          longitude?: number | null;
          approval_status?: ShopApprovalStatus;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          owner_id?: string;
          name?: string;
          shop_type?: ShopType;
          description?: string | null;
          phone?: string;
          whatsapp?: string | null;
          address?: string;
          area?: string;
          city?: string;
          latitude?: number | null;
          longitude?: number | null;
          approval_status?: ShopApprovalStatus;
          created_at?: string;
          updated_at?: string;
        }
      >;
      listings: Table<
        {
          id: string;
          shop_id: string;
          item_name: string;
          description: string | null;
          category: string | null;
          quantity: number;
          unit: string;
          price: number | null;
          expiry_date: string | null;
          status: ListingStatus;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          shop_id: string;
          item_name: string;
          description?: string | null;
          category?: string | null;
          quantity?: number;
          unit?: string;
          price?: number | null;
          expiry_date?: string | null;
          status?: ListingStatus;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          shop_id?: string;
          item_name?: string;
          description?: string | null;
          category?: string | null;
          quantity?: number;
          unit?: string;
          price?: number | null;
          expiry_date?: string | null;
          status?: ListingStatus;
          created_at?: string;
          updated_at?: string;
        }
      >;
      notify_requests: Table<
        {
          id: string;
          listing_id: string | null;
          customer_id: string | null;
          contact_method: NotifyContactMethod;
          contact_value: string;
          status: NotifyRequestStatus;
          created_at: string;
          fulfilled_at: string | null;
        },
        {
          id?: string;
          listing_id?: string | null;
          customer_id?: string | null;
          contact_method: NotifyContactMethod;
          contact_value: string;
          status?: NotifyRequestStatus;
          created_at?: string;
          fulfilled_at?: string | null;
        },
        {
          id?: string;
          listing_id?: string | null;
          customer_id?: string | null;
          contact_method?: NotifyContactMethod;
          contact_value?: string;
          status?: NotifyRequestStatus;
          created_at?: string;
          fulfilled_at?: string | null;
        }
      >;
      shop_contacts: Table<
        {
          id: string;
          shop_id: string;
          listing_id: string | null;
          contact_type: ShopContactType;
          created_at: string;
        },
        {
          id?: string;
          shop_id: string;
          listing_id?: string | null;
          contact_type: ShopContactType;
          created_at?: string;
        },
        {
          id?: string;
          shop_id?: string;
          listing_id?: string | null;
          contact_type?: ShopContactType;
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      get_my_shop_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      complete_shop_owner_signup: {
        Args: {
          _full_name: string;
          _phone: string;
          _shop_name: string;
          _shop_type: ShopType;
          _whatsapp: string | null;
          _address: string;
          _area: string;
          _city: string;
        };
        Returns: string;
      };
      update_my_shop_owner_details: {
        Args: {
          _full_name: string;
          _phone: string;
          _shop_name: string;
          _shop_type: ShopType;
          _whatsapp: string | null;
          _address: string;
          _area: string;
          _city: string;
        };
        Returns: undefined;
      };
      set_shop_approval_status: {
        Args: {
          _shop_id: string;
          _status: ShopApprovalStatus;
        };
        Returns: undefined;
      };
      expire_active_listings: {
        Args: Record<string, never>;
        Returns: number;
      };
      request_listing_availability: {
        Args: {
          _listing_id: string;
          _contact_method: "whatsapp" | "email";
          _contact_value: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: AppRole;
      shop_type: ShopType;
      shop_approval_status: ShopApprovalStatus;
      listing_status: ListingStatus;
      notify_contact_method: NotifyContactMethod;
      notify_request_status: NotifyRequestStatus;
      shop_contact_type: ShopContactType;
    };
    CompositeTypes: Record<string, never>;
  };
};
