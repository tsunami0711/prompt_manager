use crate::error::{AppError, AppResult};

const SERVICE: &str = "prompt-manager";

pub fn save_api_key(api_key_ref: &str, api_key: &str) -> AppResult<()> {
    let entry = keyring::Entry::new(SERVICE, api_key_ref)
        .map_err(|err| AppError::Validation(err.to_string()))?;
    entry
        .set_password(api_key)
        .map_err(|err| AppError::Validation(err.to_string()))
}

pub fn load_api_key(api_key_ref: &str) -> AppResult<String> {
    let entry = keyring::Entry::new(SERVICE, api_key_ref)
        .map_err(|err| AppError::Validation(err.to_string()))?;
    entry
        .get_password()
        .map_err(|err| AppError::Validation(err.to_string()))
}
