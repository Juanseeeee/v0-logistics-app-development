export interface Client {
  id: string;
  company: string;
}

export interface Driver {
  id: string;
  name: string;
  transport_company?: {
    id: string;
    name: string;
  };
  vehicles?: {
    patent_chasis?: string;
    patent_semi?: string;
  };
}

export interface Product {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
}

export interface L1Trip {
  id: string;
  date: string;
  client_name?: string;
  product_name?: string;
  origin?: string;
  destination?: string;
  driver_name?: string;
  transport_company?: string;
  chasis_patent?: string;
  semi_patent?: string;
  status?: string;
}

export interface L2Trip {
  id: string;
  trip_number: number;
  date: string;
  client_id: string;
  product_id: string;
  origin: string;
  destination: string;
  origin_company?: string;
  destination_company?: string;
  tare_origin?: string | number;
  tare_destination?: string | number;
  gross_weight?: string | number;
  gross_destination?: string | number;
  net_origin?: string | number;
  net_destination?: string | number;
  weight_difference?: string | number;
  tons_delivered?: string | number;
  driver_id?: string;
  third_party_transport?: string;
  chasis_patent?: string;
  semi_patent?: string;
  category?: string;
  status?: string;
  
  // Pricing & Amounts
  tariff_rate?: string | number;
  trip_amount?: string | number;
  third_party_rate?: string | number;
  third_party_amount?: string | number;
  
  // Billing & Settling
  client_invoice_passed?: boolean;
  client_invoice_number?: string;
  client_invoice_date?: string;
  client_payment_date?: string;
  client_payment_status?: string;
  client_fca_number?: string;
  
  third_party_invoice?: string;
  third_party_payment_date?: string;
  third_party_payment_status?: string;

  bulk_billing_id?: string;
  bulk_settlement_id?: string;
  bulk_billing_date?: string;
  bulk_settlement_date?: string;

  // Relations
  clients?: Client;
  products?: Product;
  drivers?: Driver;
}
