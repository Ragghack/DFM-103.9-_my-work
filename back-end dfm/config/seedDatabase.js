// seedDatabase.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Check if super admin already exists
    const existingSuperAdmin = await mongoose.connection.collection('users').findOne({ 
      email: "superadmin@dfmmedia.cm" 
    });

    if (!existingSuperAdmin) {
      // Hash password for super admin
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('superadmin2024', saltRounds);

      // Insert super admin user
      await mongoose.connection.collection('users').insertOne({
        email: "superadmin@dfmmedia.cm",
        password_hash: hashedPassword,
        name: "Super Administrator",
        role: "superadmin",
        is_active: true,
        permissions: ["all"],
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('✓ Super admin user created');
    } else {
      console.log('✓ Super admin user already exists');
    }

    // Check if default settings exist
    const existingSettings = await mongoose.connection.collection('website_settings').findOne();

    if (!existingSettings) {
      // Insert default settings
      await mongoose.connection.collection('website_settings').insertOne({
        site_title: "DFM Media",
        site_description: "DFM Media is a leading source for news, economy, and finance information in Cameroon and Africa.",
        contact_email: "contact@dfmmedia.cm",
        contact_phone: "+237 6XX XXX XXX",
        primary_color: "#D4AF37",
        default_language: "en",
        theme: "light",
        social_links: {
          facebook: "",
          twitter: "",
          linkedin: "",
          youtube: ""
        },
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('✓ Default website settings created');
    } else {
      console.log('✓ Website settings already exist');
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = seedDatabase;