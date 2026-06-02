export interface Room {
  id: string;
  name: string;
  capacity_tonnes: number;
  current_tonnes: number;
  target_temp: number;
  current_temp: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  company: string | null;
  whatsapp: string | null;
  address: string | null;
  client_type: string;
  rate_per_tonne: number;
  payment_terms: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  client_id: string;
  room_id: string;
  type: "in" | "out";
  product_type: string;
  tonnes: number;
  date: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  fridge_clients?: { name: string; company: string | null };
  fridge_rooms?: { name: string };
}

export interface Inventory {
  id: string;
  client_id: string;
  room_id: string;
  product_type: string;
  tonnes: number;
  date_in: string;
  rate_per_tonne: number;
  fridge_clients?: { name: string; company: string | null };
  fridge_rooms?: { name: string };
}

export interface Invoice {
  id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  total_tonnes: number;
  rate: number;
  amount: number;
  status: string;
  paid_amount: number;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
  fridge_clients?: { name: string; company: string | null };
}

export interface Contract {
  id: string;
  client_id: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  rate_per_tonne: number;
  reserved_tonnes: number | null;
  room_id: string | null;
  status: string;
  notes: string | null;
  fridge_clients?: { name: string };
  fridge_rooms?: { name: string };
}

export interface TempLog {
  id: string;
  room_id: string;
  temperature: number;
  recorded_at: string;
}
