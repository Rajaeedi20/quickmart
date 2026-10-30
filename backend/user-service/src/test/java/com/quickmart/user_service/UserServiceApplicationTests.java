package com.quickmart.user_service;

import com.quickmart.user.UserServiceApplication;
import com.quickmart.user.entity.User;
import com.quickmart.user.repository.UserRepository;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(classes = UserServiceApplication.class)
class UserServiceApplicationTests {

	@Autowired
	private UserRepository userRepository;

	@Test
	void contextLoads() {
	}

	@Test
	@Transactional
	void savesUserUsingExistingFullNameColumn() {
		User user = userRepository.saveAndFlush(
				new User(
						"QuickMart Mapping Test",
						"9" + UUID.randomUUID().toString().replace("-", "").substring(0, 9),
						UUID.randomUUID() + "@example.invalid",
						"test-hash"));

		Assertions.assertNotNull(user.getId());
		Assertions.assertEquals("QuickMart Mapping Test", user.getName());
	}

}
