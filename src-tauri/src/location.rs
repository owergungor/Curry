//! Windows Location Services API integration for precise location & reverse geocoding.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocationAddress {
    pub street: Option<String>,
    pub district: Option<String>,
    pub city: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
    pub formatted_address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreciseLocationResult {
    pub latitude: f64,
    pub longitude: f64,
    pub accuracy: f64,
    pub timestamp: u64,
    pub address: Option<LocationAddress>,
}

#[cfg(target_os = "windows")]
pub async fn get_precise_location() -> Result<PreciseLocationResult, String> {
    use windows::Devices::Geolocation::{
        BasicGeoposition, GeolocationAccessStatus, Geolocator, PositionAccuracy,
    };
    use windows::Services::Maps::{MapLocationFinder, MapLocationFinderStatus};

    // 1. Request access permission
    let access_status = Geolocator::RequestAccessAsync()
        .map_err(|e| format!("Failed to request location access: {e}"))?
        .await
        .map_err(|e| format!("Failed to evaluate location permission: {e}"))?;

    match access_status {
        GeolocationAccessStatus::Allowed => {},
        GeolocationAccessStatus::Denied => {
            return Err("PERMISSION_DENIED".to_string());
        },
        GeolocationAccessStatus::Unspecified => {
            return Err("LOCATION_DISABLED".to_string());
        },
        _ => {
            return Err("PERMISSION_DENIED".to_string());
        }
    }

    // 2. Initialize Geolocator with High Accuracy
    let geolocator = Geolocator::new()
        .map_err(|e| format!("Failed to initialize Windows Geolocator: {e}"))?;
    let _ = geolocator.SetDesiredAccuracy(PositionAccuracy::High);

    // 3. Request Geoposition with timeout (10 seconds)
    let max_age = windows::Foundation::TimeSpan { Duration: 0 };
    let timeout = windows::Foundation::TimeSpan { Duration: 100_000_000 }; // 10 seconds in 100ns units
    let geoposition_op = geolocator
        .GetGeopositionAsyncWithAgeAndTimeout(max_age, timeout)
        .or_else(|_| geolocator.GetGeopositionAsync())
        .map_err(|e| format!("Failed to initiate geoposition request: {e}"))?;

    let geoposition = geoposition_op
        .await
        .map_err(|e| {
            let err_str = e.to_string();
            if err_str.to_lowercase().contains("timeout") || e.code().0 == -2147023436 {
                "TIMEOUT".to_string()
            } else if err_str.to_lowercase().contains("denied") || err_str.to_lowercase().contains("access") {
                "PERMISSION_DENIED".to_string()
            } else if err_str.to_lowercase().contains("disabled") {
                "LOCATION_DISABLED".to_string()
            } else {
                format!("Failed to retrieve geoposition: {e}")
            }
        })?;

    let coordinate = geoposition.Coordinate()
        .map_err(|e| format!("Failed to get coordinate: {e}"))?;

    let point = coordinate.Point()
        .map_err(|e| format!("Failed to get geopoint: {e}"))?;

    let pos: BasicGeoposition = point.Position()
        .map_err(|e| format!("Failed to get position: {e}"))?;

    let accuracy = coordinate.Accuracy().unwrap_or(0.0);

    let timestamp = coordinate.Timestamp()
        .map(|dt| {
            // Convert Windows DateTime (100ns since 1601-01-01) to Unix timestamp ms
            let win_ticks = dt.UniversalTime as u64;
            (win_ticks / 10_000).saturating_sub(11_644_473_600 * 1_000)
        })
        .unwrap_or_else(|_| {
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_millis() as u64)
                .unwrap_or(0)
        });

    // 4. Reverse Geocoding / Civic Address
    let mut address = None;

    let clean_str = |s: Option<String>| -> Option<String> {
        s.map(|val| val.trim_matches('\0').trim().to_string())
            .filter(|val| !val.is_empty())
    };

    if let Ok(civic) = geoposition.CivicAddress() {
        let city = clean_str(civic.City().ok().map(|s| s.to_string()));
        let country = clean_str(civic.Country().ok().map(|s| s.to_string()));
        let postal_code = clean_str(civic.PostalCode().ok().map(|s| s.to_string()));
        let state = clean_str(civic.State().ok().map(|s| s.to_string()));

        if city.is_some() || country.is_some() || postal_code.is_some() || state.is_some() {
            let mut formatted_parts = Vec::new();
            if let Some(ref c) = city { formatted_parts.push(c.as_str()); }
            if let Some(ref s) = state { formatted_parts.push(s.as_str()); }
            if let Some(ref co) = country { formatted_parts.push(co.as_str()); }

            let formatted = if !formatted_parts.is_empty() {
                Some(formatted_parts.join(", "))
            } else {
                None
            };

            address = Some(LocationAddress {
                street: None,
                district: state,
                city,
                postal_code,
                country,
                formatted_address: formatted,
            });
        }
    }

    if address.is_none() {
        if let Ok(finder_op) = MapLocationFinder::FindLocationsAtAsync(&point) {
            if let Ok(result) = finder_op.await {
                let status = result.Status().unwrap_or(MapLocationFinderStatus::UnknownError);
                if status == MapLocationFinderStatus::Success {
                    if let Ok(locations) = result.Locations() {
                        if let Ok(loc) = locations.GetAt(0) {
                            if let Ok(addr) = loc.Address() {
                                let street = clean_str(addr.Street().ok().map(|s| s.to_string()));
                                let district = clean_str(addr.District().ok().map(|s| s.to_string()));
                                let town = clean_str(addr.Town().ok().map(|s| s.to_string()));
                                let postal_code = clean_str(addr.PostCode().ok().map(|s| s.to_string()));
                                let country = clean_str(addr.Country().ok().map(|s| s.to_string()));
                                let formatted = clean_str(addr.FormattedAddress().ok().map(|s| s.to_string()));

                                address = Some(LocationAddress {
                                    street,
                                    district,
                                    city: town,
                                    postal_code,
                                    country,
                                    formatted_address: formatted,
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(PreciseLocationResult {
        latitude: pos.Latitude,
        longitude: pos.Longitude,
        accuracy,
        timestamp,
        address,
    })
}

#[cfg(not(target_os = "windows"))]
pub async fn get_precise_location() -> Result<PreciseLocationResult, String> {
    Err("Location services are only supported on Windows".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_precise_location_windows() {
        let res = tauri::async_runtime::block_on(get_precise_location());
        println!("Location test result: {:?}", res);
        match res {
            Ok(loc) => {
                println!("Got coordinates: lat={}, lon={}, acc={}m", loc.latitude, loc.longitude, loc.accuracy);
                if let Some(addr) = loc.address {
                    println!("Got address: {:?}", addr);
                }
            }
            Err(e) => {
                println!("Location service returned expected state: {}", e);
            }
        }
    }
}
