CREATE DATABASE PHARMACY;

CREATE TABLE users (
    id SERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(200) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(200) NOT NULL,
    user_type VARCHAR(200) NOT NULL
);

CREATE TABLE inventory (
    item_name VARCHAR(250) NOT NULL,
    brand VARCHAR(250) NOT NULL,
    manufacturer VARCHAR(250) NOT NULL,
    dosage VARCHAR(250) NOT NULL,
    expiration DATE NOT NULL,
    quantity INT NOT NULL,
    PRIMARY KEY (item_name, brand)
)

CREATE TABLE request (
    rq_id VARCHAR(250) NOT NULL,
    pt_name VARCHAR(250) NOT NULL,
    pt_age INT NOT NULL,
    pt_gender VARCHAR(15) NOT NULL,
    pt_contact VARCHAR(25) NOT NULL,
    pt_address VARCHAR(250) NOT NULL,
    pt_prescription BYTEA NOT NULL,
    rp_name VARCHAR(250) NOT NULL,
    rp_age INT NOT NULL,
    rp_relationship VARCHAR(250) NOT NULL,
    rp_contact VARCHAR(25) NOT NULL,
    rp_address VARCHAR(250) NOT NULL,
    rp_valid_id BYTEA NOT NULL,
    PRIMARY KEY (rq_id)
);

CREATE TABLE records (
    rq_id VARCHAR(250) NOT NULL,
    pt_name VARCHAR(250) NOT NULL,
    rp_name VARCHAR(250) NOT NULL,
    rp_relationship VARCHAR(250) NOT NULL,
    pt_gender VARCHAR(15) NOT NULL,
    pt_age INT NOT NULL,
    pt_contact VARCHAR(25) NOT NULL,
    pt_address VARCHAR(250) NOT NULL,
    item_name VARCHAR(250) NOT NULL,
    brand VARCHAR(250) NOT NULL,
    quantity INT NOT NULL
);