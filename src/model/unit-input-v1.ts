/* Generated from schemas/unit-input-v1.schema.json. Run npm run types:generate. */

export type SchemaVersion = "unit-v1";
export type Id = string;
export type Name = string;
export type Address = string;
export type Municipality = string;
export type PropertyId = string | null;
export type ApartmentId = string | null;
export type HousingCompany = string | null;
export type Year = number | null;
export type Floor = string | null;
export type Stair = string | null;
export type SurveyId = string;
export type CapturedAt = string;
export type Id1 = string;
export type Organisation = string | null;
export type Devices = string[];
export type DataOrigin = "real_survey" | "synthetic_fixture" | "regression_baseline";
export type Video = boolean;
export type Photos = "none" | "details_only" | "full";
export type GivenBy = string | null;
export type GivenAt = string | null;
export type Purpose = string[];
export type Video1 = number;
export type Photos1 = number;
export type Id2 = string;
export type ValueMm = number;
export type Status = "measured" | "inferred" | "assumed";
export type Method =
  "laser" | "tape" | "lidar_scan" | "video" | "archive_drawing" | "registry" | "derived" | "assumption";
/**
 * @minItems 1
 */
export type SourceRefs = [string, ...string[]];
export type ConfidenceMm = number | null;
export type ConfirmedBy = string | null;
export type CapturedAt1 = string | null;
export type Device = string | null;
export type Note = string | null;
export type Kind = "load_bearing" | "partition" | "external" | "party";
export type WetSide = string | null;
export type SourceRefs1 = string[];
export type Walls = Wall[];
export type Id3 = string;
export type Kind1 = "door" | "sliding_door" | "window" | "opening";
export type HostWall = string;
export type Swing = ("left" | "right" | "double" | "slide") | null;
export type Openings = Opening[];
export type Id4 = string;
export type Name1 = string;
export type Kind2 = "wet" | "sauna" | "kitchen" | "bedroom" | "living" | "hall" | "storage" | "wc" | "balcony";
/**
 * @minItems 4
 */
export type Polygon = [Point2D, Point2D, Point2D, Point2D, ...Point2D[]];
export type Floor1 = string | null;
export type Walls1 = string | null;
export type Rooms = Room[];
export type Kind3 = "wc" | "sink" | "shower" | "bathtub" | "stove" | "cabinet" | "grab_bar";
export type RotationDeg = number;
export type Clearance = {
  [k: string]: Measurement;
} | null;
export type Id5 = string;
export type Fixtures = Fixture[];
export type Id6 = string;
export type AtOpening = string | null;
export type BetweenRooms = [string, string] | null;
export type Kind4 = "threshold" | "step" | "slope";
export type Thresholds = Threshold[];
export type Id7 = string;
export type From = string;
export type To = string;
export type Measurements = RawMeasurement[];
export type Op = "demolish_wall";
export type Target = string;
export type Op1 = "add_wall";
export type Op2 = "modify_opening";
export type Target1 = string;
export type Swing1 = ("left" | "right" | "double" | "slide") | null;
export type Op3 = "remove_threshold";
export type Target2 = string;
export type Op4 = "add_fixture";
export type Op5 = "replace_fixture";
export type Target3 = string;
export type Kind5 = "wc" | "sink" | "shower" | "bathtub" | "stove" | "cabinet" | "grab_bar";
export type RotationDeg1 = number;
export type Clearance1 = {
  [k: string]: Measurement;
} | null;
export type Op6 = "change_finish";
export type Room1 = string;
export type Floor2 = string | null;
export type Walls2 = string | null;
export type Changes = (
  DemolishWall | AddWall | ModifyOpening | RemoveThreshold | AddFixture | ReplaceFixture | ChangeFinish
)[];
export type Profiles = string[];
export type Recipients = string[];
export type DesignerName = string | null;
export type Revision = string;
export type NorthDeg = number | null;

export interface UnitInputs {
  schema_version: SchemaVersion;
  project: ProjectInfo;
  building_ref?: BuildingRef;
  survey: SurveyInfo;
  baseline: Baseline;
  changes?: Changes;
  profiles?: Profiles;
  user?: User;
  documents?: Documents;
  north_deg?: NorthDeg;
}
export interface ProjectInfo {
  id: Id;
  name: Name;
  address: Address;
  municipality: Municipality;
  property_id?: PropertyId;
  apartment_id?: ApartmentId;
}
export interface BuildingRef {
  housing_company?: HousingCompany;
  year?: Year;
  floor?: Floor;
  stair?: Stair;
}
export interface SurveyInfo {
  survey_id: SurveyId;
  captured_at: CapturedAt;
  surveyor: Surveyor;
  devices?: Devices;
  data_origin: DataOrigin;
  consent?: Consent;
}
export interface Surveyor {
  id: Id1;
  organisation?: Organisation;
}
export interface Consent {
  video?: Video;
  photos?: Photos;
  given_by?: GivenBy;
  given_at?: GivenAt;
  purpose?: Purpose;
  retention_days?: RetentionDays;
}
export interface RetentionDays {
  video?: Video1;
  photos?: Photos1;
}
export interface Baseline {
  walls?: Walls;
  openings?: Openings;
  rooms?: Rooms;
  fixtures?: Fixtures;
  thresholds?: Thresholds;
  measurements?: Measurements;
}
export interface Wall {
  id: Id2;
  a: Point2D;
  b: Point2D;
  thickness: Measurement;
  kind: Kind;
  wet_side?: WetSide;
  source_refs?: SourceRefs1;
}
export interface Point2D {
  x: Measurement;
  y: Measurement;
}
export interface Measurement {
  value_mm: ValueMm;
  status: Status;
  method: Method;
  source_refs: SourceRefs;
  confidence_mm?: ConfidenceMm;
  confirmed_by?: ConfirmedBy;
  captured_at?: CapturedAt1;
  device?: Device;
  note?: Note;
}
export interface Opening {
  id: Id3;
  kind: Kind1;
  host_wall: HostWall;
  along_wall: Measurement;
  width: Measurement;
  clear_width?: Measurement | null;
  height?: Measurement | null;
  sill_z?: Measurement | null;
  swing?: Swing;
}
export interface Room {
  id: Id4;
  name: Name1;
  kind: Kind2;
  polygon: Polygon;
  floor?: Floor1;
  walls?: Walls1;
}
export interface Fixture {
  kind: Kind3;
  x: Measurement;
  y: Measurement;
  width: Measurement;
  depth: Measurement;
  rotation_deg?: RotationDeg;
  height?: Measurement | null;
  clearance?: Clearance;
  id: Id5;
}
export interface Threshold {
  id: Id6;
  at_opening?: AtOpening;
  between_rooms?: BetweenRooms;
  height: Measurement;
  kind: Kind4;
}
export interface RawMeasurement {
  id: Id7;
  from: From;
  to: To;
  value: Measurement;
}
export interface DemolishWall {
  op: Op;
  target: Target;
}
export interface AddWall {
  op: Op1;
  wall: Wall;
}
export interface ModifyOpening {
  op: Op2;
  target: Target1;
  set: ModifyOpeningSet;
}
export interface ModifyOpeningSet {
  clear_width?: Measurement | null;
  width?: Measurement | null;
  along_wall?: Measurement | null;
  height?: Measurement | null;
  sill_z?: Measurement | null;
  swing?: Swing1;
}
export interface RemoveThreshold {
  op: Op3;
  target: Target2;
}
export interface AddFixture {
  op: Op4;
  fixture: Fixture;
}
export interface ReplaceFixture {
  op: Op5;
  target: Target3;
  fixture: FixtureData;
}
export interface FixtureData {
  kind: Kind5;
  x: Measurement;
  y: Measurement;
  width: Measurement;
  depth: Measurement;
  rotation_deg?: RotationDeg1;
  height?: Measurement | null;
  clearance?: Clearance1;
}
export interface ChangeFinish {
  op: Op6;
  room: Room1;
  floor?: Floor2;
  walls?: Walls2;
}
export interface User {
  [k: string]: number;
}
export interface Documents {
  recipients?: Recipients;
  designer_name?: DesignerName;
  revision?: Revision;
}
