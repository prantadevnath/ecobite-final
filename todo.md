# EcoBite - Project TODO

## Database & Schema
- [x] Extend users table with role enum (customer, restaurant, admin) and email/password fields
- [x] Create restaurants table (userId, name, description, status: pending/approved)
- [x] Create boxes table (restaurantId, title, description, price, quantityAvailable, isActive)
- [x] Create reservations table (customerId, boxId, status: active/picked_up/cancelled, pin, qrCode)
- [x] Apply all migrations via webdev_execute_sql

## Backend (tRPC Routers)
- [x] Email/password signup procedure (hash password, create user)
- [x] Email/password login procedure (verify password, set session cookie)
- [x] Auth: me, logout procedures
- [x] Restaurant: register restaurant profile (pending approval)
- [x] Restaurant: create/update/delete boxes
- [x] Restaurant: list own boxes
- [x] Restaurant: redeem order by PIN
- [x] Restaurant: redeem order by QR token
- [x] Customer: browse approved restaurant boxes (quantity > 0)
- [x] Customer: reserve a box (decrement quantity, generate PIN + QR data)
- [x] Customer: cancel reservation (increment quantity)
- [x] Customer: list own reservations
- [x] Admin: list all users
- [x] Admin: list all restaurants with status
- [x] Admin: approve restaurant
- [x] Admin: reject restaurant

## Frontend Pages & Components
- [x] Global styles: sacred geometry theme (cream bg, gold accents, navy typography)
- [x] SacredGeometry SVG background component
- [x] Login page (email/password)
- [x] Signup page (email/password, role selection: customer/restaurant)
- [x] Protected route wrapper
- [x] Customer: Browse page (box cards with Reserve button)
- [x] Customer: My Reservations page (active reservations list)
- [x] Customer: Reservation detail with QR code and 6-digit PIN modal
- [x] Restaurant: Dashboard (create/manage boxes)
- [x] Restaurant: Redemption page (PIN input + QR scan)
- [x] Admin: Dashboard (users table + restaurants table with Approve/Reject buttons)
- [x] Navigation header with role-based links
- [x] App routing in App.tsx with role-based guards

## QR Code
- [x] Install qrcode library for QR generation
- [x] Generate QR code data URL from reservation token on server
- [x] Display QR code image on customer reservation detail

## Tests
- [x] Auth signup/login procedures test
- [x] Reserve box (quantity decrement) test
- [x] Cancel reservation (quantity increment) test
- [x] Admin approve restaurant test
- [x] Auth logout test

## Rebranding (v2.0)
- [x] Extract green leaf logo from user image
- [x] Upload logo to webdev storage
- [x] Update CSS theme from gold/cream to green/white
- [x] Replace all component color references (gold → green)
- [x] Update AppLayout to use new logo image
- [x] Replace sacred geometry background with clean white
- [x] Test all functionality with new theme

## Branding Audit & Consistency (v2.1)
- [x] Audit all remaining gold color references in codebase
- [x] Replace all remaining mixed gradients with pure green
- [x] Replace all cream backgrounds with light green secondary colors
- [x] Replace all old border colors with green-tinted borders
- [x] Update Login page with green logo image
- [x] Update Signup page with green logo image
- [x] Update Home page with green logo image
- [x] Verify 100% consistency across all pages
- [x] All 12 tests passing with new theme
- [x] Zero old gold color references remaining
