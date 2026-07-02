import { Role } from "./auth";

export type KayntiStatus = "suunniteltu" | "peruttu" | "toteutunut";
export type PoikkeusSyy = "omainen_hakee" | "asiakas_sairaalassa" | "muu";

export interface Asiakas {
  id: number;
  full_name: string;
  address: string | null;
  birth_date: string | null;
  notes: string | null;
}

export interface UserOut {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  phone: string | null;
  is_active: boolean;
}

export interface Poikkeus {
  id: number;
  kaynti_id: number;
  luonut_kayttaja_id: number;
  syy: PoikkeusSyy;
  kuvaus: string | null;
  created_at: string;
}

export interface Kaynti {
  id: number;
  asiakas_id: number;
  tyontekija_id: number | null;
  date: string;
  start_time: string;
  end_time: string;
  status: KayntiStatus;
  notes: string | null;
  asiakas: Asiakas;
  tyontekija: UserOut | null;
  poikkeus: Poikkeus | null;
}
