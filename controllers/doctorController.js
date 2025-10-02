const { users } = require("@clerk/clerk-sdk-node");

exports.getAllDoctors = async (req, res) => {
  try {
    const doctorList = [];

    // Fetch all users from Clerk (paginated if needed)
    for await (const user of users.getUserList()) {
      // Only include users with role "doctor"
      if (user.publicMetadata?.role === "doctor") {
        doctorList.push({
          id: user.id,
          name: user.firstName,
          email: user.emailAddresses[0]?.emailAddress || "",
          role: user.publicMetadata.role,
          degree: user.publicMetadata.degree || null,
          specialty: user.publicMetadata.specialty || null,
          experience: user.publicMetadata.experience || null,
          availability: user.publicMetadata.availability || [],
          fees: user.publicMetadata.fees || null,
          photo: user.profileImageUrl || null,
        });
      }
    }

    res.json({
      success: true,
      message: "Doctors fetched successfully",
      data: doctorList,
    });
  } catch (err) {
    console.error("Get doctors error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to fetch doctors" });
  }
};
