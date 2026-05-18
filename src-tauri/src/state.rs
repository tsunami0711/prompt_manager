use std::path::PathBuf;
use std::sync::Mutex;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};

use crate::db::migrations::migrate;
use crate::db::repo::Repository;
use crate::error::{AppError, AppResult};

pub struct AppState {
    db_path: PathBuf,
    lock: Mutex<()>,
}

impl AppState {
    pub fn new(app: &AppHandle) -> AppResult<Self> {
        let app_dir = app
            .path()
            .app_data_dir()
            .map_err(|err| AppError::Validation(err.to_string()))?;
        std::fs::create_dir_all(&app_dir).map_err(|err| AppError::Validation(err.to_string()))?;
        let db_path = app_dir.join("prompt-manager.sqlite3");
        let conn = Connection::open(&db_path)?;
        migrate(&conn)?;
        Ok(Self {
            db_path,
            lock: Mutex::new(()),
        })
    }

    pub fn with_repo<T>(&self, f: impl FnOnce(&Repository) -> AppResult<T>) -> AppResult<T> {
        let _guard = self.lock.lock().expect("database mutex poisoned");
        let conn = Connection::open(&self.db_path)?;
        migrate(&conn)?;
        let repo = Repository::new(conn);
        f(&repo)
    }
}
