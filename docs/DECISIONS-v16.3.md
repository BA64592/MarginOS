# Decisions locked (v16.3)

**MarginOS Spec Amendment v16.3** — Clear sample data and Start fresh.  
Approved by Akthar Uddin, 29 October 2026.

| ID | Decision |
| --- | --- |
| **E1** | Built-in sample orders/costs are always labelled **Sample data** and each row is marked sample. Loading/clearing sample is **not** an upload. |
| **E2** | **Clear sample data** removes only sample rows (with “Are you sure?”). Own data untouched. Only while sample is loaded. |
| **E3** | **Start fresh** (settings) deletes all shop data; keeps account, Pro, purchase history and settings. Cancel is the safe default. |
| **E4** | Neither action restores Free daily uploads. |
| **E5** | Start fresh ≠ account deletion; wording must keep them distinct. |
| **E7** | Confirmed actions log one privacy-safe event (type, time, account id, plan, counts). |
| **K7 / E9** | On the **first successful own upload**, sample data is cleared automatically with note: “Sample data has been removed now that your own data is in.” Failed/cancelled uploads leave sample in place. |

See `docs/MarginOS-Amendment-v16.3.pdf` and `docs/OPEN-QUESTIONS.md` Q6.
